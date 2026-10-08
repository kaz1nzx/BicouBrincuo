import {
  commandSchema,
  checkoutSchema,
  type Command,
  type Checkout,
} from "./schemas";
import type {
  State,
  Inventory,
  Kind,
  Product,
  Order,
  Requirement,
  Entity,
} from "./types";
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n,
  );
export const number = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(n);
export const dateLabel = (s: string) =>
  s
    ? new Date(s.length === 10 ? s + "T12:00:00" : s).toLocaleDateString(
        "pt-BR",
      )
    : "—";
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const round = (v: number) =>
  Math.round((v + Number.EPSILON) * 1e6) / 1e6;
const uuid = () => crypto.randomUUID();
function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export function item(s: State, kind: Kind, id: string): Inventory {
  const list =
    kind === "material" ? s.materials : kind === "part" ? s.parts : s.products;
  const found = list.find((v) => v.id === id);
  assert(found, "Item não encontrado.");
  return found;
}
export function productCost(s: State, p: Product): number {
  return round(
    p.recipe.reduce(
      (sum, r) => sum + item(s, r.kind, r.itemId).cost * r.quantity,
      0,
    ) +
      p.labor +
      p.overhead +
      p.extra,
  );
}
export function suggestedPrice(
  cost: number,
  margin: number,
  taxes: number,
  discount = 0,
) {
  const base = 1 - (margin + taxes) / 100;
  assert(
    cost >= 0 &&
      margin >= 0 &&
      taxes >= 0 &&
      base > 0 &&
      discount >= 0 &&
      discount < 100,
    "Margem + taxas devem ser menores que 100%, e desconto menor que 100%.",
  );
  return Math.ceil((cost / base / (1 - discount / 100)) * 100) / 100;
}
export function activeOrders(s: State) {
  return s.orders
    .filter((o) => !["Cancelado", "Enviado", "Entregue"].includes(o.status))
    .sort((a, b) => a.number - b.number);
}
export function productionNeeds(
  s: State,
  lines: { productId: string; quantity: number }[],
  deductProducts = true,
): Requirement[] {
  const required = new Map<
    string,
    { kind: "part" | "material"; itemId: string; quantity: number }
  >();
  const products = new Map<string, number>();
  lines.forEach((l) =>
    products.set(l.productId, (products.get(l.productId) || 0) + l.quantity),
  );
  products.forEach((qty, id) => {
    const p = s.products.find((p) => p.id === id);
    assert(p, "Brinquedo não encontrado.");
    const toMake = deductProducts ? Math.max(0, qty - p.stock) : qty;
    if (toMake > 0)
      assert(p.recipe.length, "Cadastre a ficha técnica de " + p.name + ".");
    p.recipe.forEach((r) => {
      const key = r.kind + ":" + r.itemId;
      required.set(key, {
        ...r,
        quantity: (required.get(key)?.quantity || 0) + r.quantity * toMake,
      });
    });
  });
  const rows: Requirement[] = [...required.values()].map((r) => {
    const v = item(s, r.kind, r.itemId);
    return {
      kind: r.kind,
      itemId: v.id,
      name: v.name,
      unit: v.unit,
      required: round(r.quantity),
      available: v.stock,
      missing: round(Math.max(0, r.quantity - v.stock)),
      action: "Disponível",
    };
  });
  const raw = new Map<string, number>();
  rows
    .filter((r) => r.kind === "material")
    .forEach((r) => raw.set(r.itemId, r.required));
  rows
    .filter((r) => r.kind === "part" && r.missing > 0)
    .forEach((r) => {
      const p = s.parts.find((p) => p.id === r.itemId)!;
      raw.set(
        p.materialId,
        (raw.get(p.materialId) || 0) +
          (p.length * r.missing) / (1 - s.settings.lossRate / 100),
      );
    });
  for (const r of rows)
    if (r.missing > 0) {
      if (r.kind === "material") r.action = "Comprar";
      else {
        const p = s.parts.find((p) => p.id === r.itemId)!;
        r.action =
          item(s, "material", p.materialId).stock + 1e-6 >=
          (raw.get(p.materialId) || 0)
            ? "Produzir"
            : "Comprar";
      }
    }
  raw.forEach((qty, id) => {
    const direct = rows.find((r) => r.kind === "material" && r.itemId === id);
    const v = item(s, "material", id);
    if (direct) {
      direct.required = round(qty);
      direct.missing = round(Math.max(0, qty - v.stock));
      direct.action = direct.missing ? "Comprar" : "Disponível";
    } else
      rows.push({
        kind: "material",
        itemId: id,
        name: v.name,
        unit: v.unit,
        required: round(qty),
        available: v.stock,
        missing: round(Math.max(0, qty - v.stock)),
        action: qty > v.stock ? "Comprar" : "Disponível",
      });
  });
  return rows;
}
export function needsForOrder(s: State, o: Order) {
  // Reservas FIFO dos produtos acabados para pedidos anteriores.
  const copy = structuredClone(s);
  for (const older of activeOrders(s).filter((a) => a.number < o.number))
    for (const line of older.items) {
      const p = copy.products.find((p) => p.id === line.productId)!;
      p.stock = Math.max(0, p.stock - line.quantity);
    }
  return productionNeeds(copy, o.items);
}
function move(
  s: State,
  kind: Kind,
  id: string,
  qty: number,
  reason: string,
  originId: string,
  date: string,
  actor: string,
) {
  const v = item(s, kind, id);
  assert(v.stock + qty >= -1e-6, "Estoque insuficiente: " + v.name);
  assert(
    v.unit !== "un" || Number.isInteger(qty),
    "Quantidade de unidades deve ser inteira.",
  );
  v.stock = round(Math.max(0, v.stock + qty));
  s.movements.push({
    id: uuid(),
    kind,
    itemId: id,
    name: v.name,
    quantity: qty,
    unit: v.unit,
    unitCost: v.cost,
    balance: v.stock,
    reason,
    originId,
    date,
    responsible: actor,
  });
}
function addStock(
  s: State,
  kind: Kind,
  id: string,
  qty: number,
  totalCost: number,
  originId: string,
  date: string,
  actor: string,
  reason: string,
) {
  const v = item(s, kind, id);
  v.cost = round((v.stock * v.cost + totalCost) / (v.stock + qty));
  move(s, kind, id, qty, reason, originId, date, actor);
}
function ensureReference(s: State, entity: Entity, id: string) {
  let used = false;
  if (entity === "materials")
    used =
      s.parts.some((p) => p.materialId === id) ||
      s.products.some((p) =>
        p.recipe.some((r) => r.kind === "material" && r.itemId === id),
      ) ||
      s.purchases.some((p) => p.materialId === id);
  if (entity === "parts")
    used = s.products.some((p) =>
      p.recipe.some((r) => r.kind === "part" && r.itemId === id),
    );
  if (entity === "products")
    used =
      s.orders.some((o) => o.items.some((i) => i.productId === id)) ||
      s.productions.some((p) => p.productId === id);
  if (entity === "customers") used = s.orders.some((o) => o.customerId === id);
  if (entity === "suppliers")
    used =
      s.materials.some((m) => m.supplierId === id) ||
      s.purchases.some((p) => p.supplierId === id);
  if (["materials", "parts", "products"].includes(entity))
    used = used || s.movements.some((m) => m.itemId === id);
  assert(
    !used,
    "Este cadastro tem vínculos ou histórico e não pode ser excluído.",
  );
}
function save(
  s: State,
  entity: Entity,
  data: Record<string, unknown>,
  actor: string,
) {
  const list = s[entity] as unknown as Record<string, unknown>[];
  const existing = list.find((v) => v.id === data.id);
  const value: Record<string, unknown> = { ...data, id: data.id || uuid() };
  if (["materials", "parts", "products"].includes(entity)) {
    assert(
      !list.some((v) => v.sku === data.sku && v.id !== data.id),
      "Este código já está cadastrado.",
    );
    assert(
      data.unit !== "un" || Number.isInteger(data.stock),
      "Estoque em unidades deve ser inteiro.",
    );
    if (existing) {
      assert(
        existing.unit === data.unit,
        "A unidade não pode mudar após o cadastro. Crie um novo material.",
      );
      Object.assign(value, { stock: existing.stock, cost: existing.cost });
      if (entity === "materials")
        Object.assign(value, {
          lastPrice: existing.lastPrice,
          lastPurchase: existing.lastPurchase,
        });
    }
  }
  if (existing) Object.assign(existing, value);
  else {
    list.push(value);
    if (
      ["materials", "parts", "products"].includes(entity) &&
      Number(data.stock) > 0
    ) {
      const kind =
        entity === "materials"
          ? "material"
          : entity === "parts"
            ? "part"
            : "product";
      const stock = Number(value.stock);
      value.stock = 0;
      move(
        s,
        kind,
        String(value.id),
        stock,
        "Saldo inicial",
        String(value.id),
        today(),
        actor,
      );
    }
  }
}
function createOrder(
  s: State,
  input: Omit<Extract<Command, { type: "order" }>, "type" | "requestId">,
  source: "painel" | "loja",
): Order {
  assert(
    s.customers.some((v) => v.id === input.customerId),
    "Cliente não encontrado.",
  );
  const quantities = new Map<string, number>();
  input.items.forEach((l) =>
    quantities.set(
      l.productId,
      (quantities.get(l.productId) || 0) + l.quantity,
    ),
  );
  const lines = [...quantities].map(([productId, quantity]) => {
    const p = s.products.find((p) => p.id === productId);
    assert(
      p && p.active && (source !== "loja" || p.online),
      "Brinquedo indisponível.",
    );
    return { productId, quantity, unitPrice: p.price, name: p.name };
  });
  const subtotal = lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0);
  assert(input.discount <= subtotal, "Desconto maior que o subtotal.");
  assert(input.deadline >= input.date, "Prazo anterior à data do pedido.");
  const order: Order = {
    ...input,
    id: uuid(),
    number: Math.max(1000, ...s.orders.map((o) => o.number)) + 1,
    items: lines,
    total: Math.round((subtotal - input.discount + input.freight) * 100) / 100,
    status: "Novo",
    source,
    sold: false,
  };
  s.orders.push(order);
  return order;
}
export function execute(
  previous: State,
  input: unknown,
  actor = "Demonstração",
): State {
  const c = commandSchema.parse(input);
  if (previous.audit.some((a) => a.id === c.requestId)) return previous;
  const s = structuredClone(previous);
  const op = uuid();
  switch (c.type) {
    case "saveMaterial":
      assert(
        !c.data.supplierId ||
          s.suppliers.some((v) => v.id === c.data.supplierId),
        "Fornecedor inválido.",
      );
      save(s, "materials", c.data, actor);
      break;
    case "savePart":
      {
        const existing = s.parts.find((p) => p.id === c.data.id);
        if (
          existing &&
          (existing.stock > 0 ||
            s.products.some((p) =>
              p.recipe.some(
                (r) => r.kind === "part" && r.itemId === existing.id,
              ),
            ))
        )
          assert(
            existing.materialId === c.data.materialId &&
              existing.length === c.data.length,
            "Peça em estoque ou em ficha técnica não pode mudar de origem/comprimento. Crie uma nova peça.",
          );
      }
      assert(
        item(s, "material", c.data.materialId).unit === "cm",
        "Peças de madeira exigem material em cm.",
      );
      assert(c.data.unit === "un", "Peças usam unidade un.");
      save(s, "parts", c.data, actor);
      break;
    case "saveProduct": {
      const seen = new Set<string>();
      c.data.recipe.forEach((r) => {
        const v = item(s, r.kind, r.itemId);
        assert(
          v.unit !== "un" || Number.isInteger(r.quantity),
          "Componentes em unidades precisam de quantidade inteira.",
        );
        const key = r.kind + r.itemId;
        assert(!seen.has(key), "Componente duplicado na ficha técnica.");
        seen.add(key);
      });
      assert(c.data.unit === "un", "Brinquedos usam unidade un.");
      save(s, "products", c.data, actor);
      break;
    }
    case "saveContact":
      save(s, c.entity, c.data, actor);
      break;
    case "saveExpense":
      save(s, "expenses", c.data, actor);
      break;
    case "delete":
      ensureReference(s, c.entity, c.id);
      assert(
        s[c.entity].some((v) => v.id === c.id),
        "Cadastro não encontrado.",
      );
      (s[c.entity] as { id: string }[]) = (
        s[c.entity] as { id: string }[]
      ).filter((v) => v.id !== c.id);
      break;
    case "purchase": {
      const v = s.materials.find((v) => v.id === c.materialId);
      assert(v, "Material não encontrado.");
      assert(
        !c.supplierId || s.suppliers.some((v) => v.id === c.supplierId),
        "Fornecedor inválido.",
      );
      const total = c.total + c.freight + c.extra;
      const cost = round(total / c.quantity);
      addStock(
        s,
        "material",
        v.id,
        c.quantity,
        total,
        op,
        c.date,
        actor,
        "Compra",
      );
      v.lastPrice = cost;
      v.lastPurchase = c.date;
      s.purchases.push({ ...c, id: op, unitCost: cost });
      break;
    }
    case "transform": {
      const v = item(s, "material", c.materialId);
      assert(v.unit === "cm", "Transformação de madeira usa cm.");
      const seen = new Set<string>();
      const outputs = c.outputs.map((o) => {
        const p = s.parts.find((p) => p.id === o.partId);
        assert(p && p.materialId === v.id, "Peça incompatível com a madeira.");
        assert(!seen.has(p.id), "Peça duplicada.");
        seen.add(p.id);
        return { ...o, length: p.length };
      });
      const useful = outputs.reduce((n, o) => n + o.length * o.quantity, 0);
      assert(
        Math.abs(useful + c.lost - c.used) < 0.001,
        "Comprimento das peças + perda deve ser igual à madeira utilizada.",
      );
      assert(useful > 0, "Nenhuma saída útil.");
      const totalCost = v.cost * c.used;
      const lostCost = v.cost * c.lost;
      const costPerCm = totalCost / useful;
      move(
        s,
        "material",
        v.id,
        -c.used,
        "Transformação",
        op,
        c.date,
        c.responsible,
      );
      const outs = outputs.map((o) => {
        const unitCost = round(o.length * costPerCm);
        addStock(
          s,
          "part",
          o.partId,
          o.quantity,
          o.quantity * unitCost,
          op,
          c.date,
          c.responsible,
          "Corte de madeira",
        );
        return { partId: o.partId, quantity: o.quantity, unitCost };
      });
      s.transformations.push({ ...c, id: op, totalCost, outputs: outs });
      if (c.lost)
        s.losses.push({
          id: uuid(),
          kind: "material",
          itemId: v.id,
          quantity: c.lost,
          cost: lostCost,
          reason: "Corte",
          date: c.date,
          responsible: c.responsible,
          notes: c.notes,
          transformationId: op,
          percentage: (c.lost / c.used) * 100,
        });
      break;
    }
    case "loss": {
      const cost = item(s, c.kind, c.itemId).cost * c.quantity;
      move(
        s,
        c.kind,
        c.itemId,
        -c.quantity,
        "Perda: " + c.reason,
        op,
        c.date,
        c.responsible,
      );
      s.losses.push({ ...c, id: op, cost });
      break;
    }
    case "production":
      assert(
        s.products.some((p) => p.id === c.productId),
        "Brinquedo inválido.",
      );
      assert(
        !c.orderId ||
          s.orders.some(
            (o) => o.id === c.orderId && !o.sold && o.status !== "Cancelado",
          ),
        "Pedido inválido.",
      );
      assert(c.deadline >= c.date, "Prazo anterior à produção.");
      s.productions.push({ ...c, id: op, status: "Planejada", cost: 0 });
      break;
    case "productionStatus": {
      const p = s.productions.find((p) => p.id === c.id);
      assert(p, "Produção não encontrada.");
      assert(
        !["Concluída", "Cancelada"].includes(p.status),
        "Esta produção já foi encerrada.",
      );
      if (c.status === "Concluída") {
        const product = s.products.find((v) => v.id === p.productId)!;
        assert(product.recipe.length, "Cadastre a ficha técnica primeiro.");
        const cost = productCost(s, product) * p.quantity;
        for (const r of product.recipe)
          move(
            s,
            r.kind,
            r.itemId,
            -r.quantity * p.quantity,
            "Produção de " + product.name,
            p.id,
            today(),
            p.responsible,
          );
        addStock(
          s,
          "product",
          product.id,
          p.quantity,
          cost,
          p.id,
          today(),
          p.responsible,
          "Produção concluída",
        );
        p.cost = cost;
      }
      p.status = c.status;
      break;
    }
    case "order":
      createOrder(s, c, "painel");
      break;
    case "orderStatus": {
      const o = s.orders.find((o) => o.id === c.id);
      assert(o, "Pedido não encontrado.");
      assert(
        o.status !== "Cancelado" && o.status !== "Entregue",
        "Pedido encerrado.",
      );
      if (o.sold) {
        assert(
          c.status === "Entregue" && o.status === "Enviado",
          "Pedido enviado aceita somente confirmação de entrega.",
        );
        o.status = c.status;
        break;
      }
      assert(c.status !== "Entregue", "Envie o pedido antes de entregar.");
      if (["Pronto", "Enviado"].includes(c.status)) {
        const copy = structuredClone(s);
        for (const older of activeOrders(s).filter((a) => a.number < o.number))
          for (const l of older.items) {
            const p = copy.products.find((p) => p.id === l.productId)!;
            p.stock = Math.max(0, p.stock - l.quantity);
          }
        for (const l of o.items)
          assert(
            item(copy, "product", l.productId).stock >= l.quantity,
            "Estoque insuficiente considerando reservas anteriores.",
          );
      }
      if (c.status === "Enviado") {
        const subtotal = o.items.reduce(
          (n, l) => n + l.quantity * l.unitPrice,
          0,
        );
        const netCents = Math.round((subtotal - o.discount) * 100);
        let allocatedCents = 0;
        for (const [index, l] of o.items.entries()) {
          const v = item(s, "product", l.productId);
          const cost = v.cost * l.quantity;
          const cents =
            index === o.items.length - 1
              ? netCents - allocatedCents
              : Math.round(
                  l.quantity *
                    l.unitPrice *
                    (1 - (subtotal ? o.discount / subtotal : 0)) *
                    100,
                );
          allocatedCents += cents;
          const revenue = cents / 100;
          move(
            s,
            "product",
            l.productId,
            -l.quantity,
            "Venda • pedido #" + o.number,
            o.id,
            today(),
            actor,
          );
          const taxes =
            (revenue *
              (s.settings.taxRate +
                s.settings.feeRate +
                s.settings.commissionRate)) /
            100;
          s.sales.push({
            id: uuid(),
            orderId: o.id,
            productId: l.productId,
            name: l.name,
            quantity: l.quantity,
            revenue,
            cost,
            profit: round(revenue - cost - taxes),
            date: today(),
            customerId: o.customerId,
            payment: o.payment,
          });
        }
        o.sold = true;
      }
      o.status = c.status;
      break;
    }
    case "price": {
      const p = s.products.find((p) => p.id === c.productId);
      assert(p, "Brinquedo não encontrado.");
      p.price = c.price;
      break;
    }
    case "settings":
      s.settings = c.data;
      break;
  }
  s.audit.push({
    id: c.requestId,
    action: c.type,
    date: new Date().toISOString(),
    actor,
  });
  return s;
}
export function checkout(
  previous: State,
  input: unknown,
): { state: State; order: Order } {
  const c: Checkout = checkoutSchema.parse(input);
  const existing = previous.orders.find(
    (o) => o.notes === "checkout:" + c.requestId,
  );
  if (existing) return { state: previous, order: existing };
  const s = structuredClone(previous);
  const customerId = uuid();
  s.customers.push({
    ...c.customer,
    id: customerId,
    notes: "Pedido recebido na loja virtual",
    company: "",
  });
  const order = createOrder(
    s,
    {
      customerId,
      items: c.items,
      date: today(),
      deadline: today(),
      discount: 0,
      freight: s.settings.defaultFreight,
      payment: c.payment,
      notes: "checkout:" + c.requestId,
    },
    "loja",
  );
  s.audit.push({
    id: c.requestId,
    action: "checkout",
    date: new Date().toISOString(),
    actor: "Loja virtual",
  });
  return { state: s, order };
}
export function inventoryValue(s: State) {
  return [...s.materials, ...s.parts, ...s.products].reduce(
    (n, i) => n + i.stock * i.cost,
    0,
  );
}
export function metrics(s: State, month = today().slice(0, 7)) {
  const sales = s.sales.filter((v) => v.date.startsWith(month));
  const expenses = s.expenses.filter((v) => v.date.startsWith(month));
  return {
    revenue: sales.reduce((n, v) => n + v.revenue, 0),
    profit:
      sales.reduce((n, v) => n + v.profit, 0) -
      expenses.reduce((n, v) => n + v.amount, 0) -
      s.losses
        .filter((v) => v.date.startsWith(month) && !v.transformationId)
        .reduce((n, v) => n + v.cost, 0),
    orders: s.orders.filter(
      (v) => v.date.startsWith(month) && v.status !== "Cancelado",
    ).length,
    quantity: sales.reduce((n, v) => n + v.quantity, 0),
    inventory: inventoryValue(s),
    productions: s.productions.filter(
      (v) => !["Concluída", "Cancelada"].includes(v.status),
    ).length,
    loss: s.losses
      .filter((v) => v.date.startsWith(month))
      .reduce((n, v) => n + v.cost, 0),
  };
}
