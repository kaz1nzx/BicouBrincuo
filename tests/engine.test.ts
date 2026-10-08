import { test } from "node:test";
import assert from "node:assert/strict";
import { demoState, emptyState, sid } from "../lib/seed";
import {
  execute,
  checkout,
  productCost,
  productionNeeds,
  suggestedPrice,
  today,
  needsForOrder,
  metrics,
} from "../lib/engine";
import type { State } from "../lib/types";
const command = (s: State, c: Record<string, unknown>) =>
  execute(s, { ...c, requestId: crypto.randomUUID() }, "Teste");
const buy = {
  type: "purchase",
  materialId: sid(11),
  supplierId: "",
  quantity: 8,
  total: 24,
  freight: 4,
  extra: 0,
  date: today(),
  invoice: "",
  notes: "",
};
test("compra soma frete, atualiza saldo e custo médio ponderado", () => {
  const s = demoState();
  const next = command(s, buy);
  assert.equal(next.materials.find((v) => v.id === sid(11))!.stock, 16);
  assert.equal(next.materials.find((v) => v.id === sid(11))!.cost, 3);
  assert.equal(next.purchases[0].unitCost, 3.5);
  assert.equal(s.materials.find((v) => v.id === sid(11))!.stock, 8);
});
test("mesma requestId não duplica entrada", () => {
  const c = { ...buy, requestId: crypto.randomUUID() };
  const once = execute(demoState(), c);
  assert.strictEqual(execute(once, c), once);
});
test("corte fecha comprimento, distribui custo e absorve perda", () => {
  const s = demoState();
  s.materials[0].stock = 200;
  s.materials[0].cost = 0.15;
  s.parts.forEach((v) => (v.stock = 0));
  const n = command(s, {
    type: "transform",
    materialId: sid(10),
    used: 200,
    lost: 20,
    outputs: [
      { partId: sid(20), quantity: 20 },
      { partId: sid(21), quantity: 5 },
      { partId: sid(22), quantity: 2 },
    ],
    date: today(),
    responsible: "Teste",
    notes: "",
  });
  assert.equal(n.materials[0].stock, 0);
  assert.equal(n.parts[0].stock, 20);
  assert.equal(n.losses[0].cost, 3);
  assert.equal(n.losses[0].percentage, 10);
  const outputValue = n.parts.reduce((sum, p) => sum + p.stock * p.cost, 0);
  assert.ok(Math.abs(outputValue - 30) < 0.0001);
});
test("corte incoerente falha sem alterar o original", () => {
  const s = demoState();
  const before = JSON.stringify(s);
  assert.throws(
    () =>
      command(s, {
        type: "transform",
        materialId: sid(10),
        used: 200,
        lost: 10,
        outputs: [{ partId: sid(20), quantity: 20 }],
        date: today(),
        responsible: "Teste",
        notes: "",
      }),
    /Comprimento/,
  );
  assert.equal(JSON.stringify(s), before);
});
test("mesma peça duplicada no corte é rejeitada", () =>
  assert.throws(
    () =>
      command(demoState(), {
        type: "transform",
        materialId: sid(10),
        used: 10,
        lost: 0,
        outputs: [
          { partId: sid(20), quantity: 1 },
          { partId: sid(20), quantity: 1 },
        ],
        date: today(),
        responsible: "Teste",
        notes: "",
      }),
    /duplicada/,
  ));
test("perda não permite estoque negativo", () =>
  assert.throws(
    () =>
      command(demoState(), {
        type: "loss",
        kind: "material",
        itemId: sid(11),
        quantity: 999,
        reason: "Erro",
        date: today(),
        responsible: "Teste",
        notes: "",
      }),
    /Estoque insuficiente/,
  ));
test("margem sobre venda não é markup", () => {
  assert.equal(suggestedPrice(24.41, 50, 0), 48.82);
  assert.equal(suggestedPrice(40, 40, 10), 80);
  assert.equal(suggestedPrice(40, 40, 10, 20), 100);
  assert.throws(() => suggestedPrice(20, 90, 10), /menores/);
});
test("ficha técnica muda com custo da matéria-prima", () => {
  const s = demoState(),
    p = s.products[0];
  const before = productCost(s, p);
  s.materials.find((m) => m.id === sid(11))!.cost += 1;
  assert.equal(productCost(s, p), before + 1.5);
});
test("planejamento agrega linhas repetidas do produto e necessidades de madeira", () => {
  const s = demoState();
  s.products[0].stock = 0;
  s.parts[0].stock = 0;
  s.parts[2].stock = 0;
  const rows = productionNeeds(s, [
    { productId: sid(30), quantity: 2 },
    { productId: sid(30), quantity: 3 },
  ]);
  assert.equal(rows.find((r) => r.itemId === sid(20))!.required, 20);
  assert.equal(rows.find((r) => r.itemId === sid(22))!.required, 10);
  assert.ok(
    Math.abs(rows.find((r) => r.itemId === sid(10))!.required - 250 / 0.9) <
      0.00001,
  );
});
test("madeira compartilhada por tipos de peça não é contada duas vezes como disponível", () => {
  const s = demoState();
  s.products[0].stock = 0;
  s.parts[0].stock = 0;
  s.parts[2].stock = 0;
  s.materials[0].stock = 70;
  const rows = productionNeeds(s, [{ productId: sid(30), quantity: 2 }]);
  assert.ok(
    rows.filter((r) => r.kind === "part").every((r) => r.action === "Comprar"),
  );
  assert.ok(rows.find((r) => r.itemId === sid(10))!.missing > 0);
});
test("falta na produção reverte todos os movimentos", () => {
  const s = demoState();
  s.parts[0].stock = 0;
  const before = JSON.stringify(s);
  assert.throws(
    () =>
      command(s, {
        type: "productionStatus",
        id: sid(50),
        status: "Concluída",
      }),
    /Estoque insuficiente/,
  );
  assert.equal(JSON.stringify(s), before);
});
test("produção concluída consome receita, adiciona produto e calcula custo médio", () => {
  let s = demoState();
  s.materials.forEach((m) => (m.stock = 10000));
  s.parts.forEach((p) => (p.stock = 1000));
  const p = s.products[0],
    unit = productCost(s, p),
    oldCost = p.stock * p.cost;
  const n = command(s, {
    type: "productionStatus",
    id: sid(50),
    status: "Concluída",
  });
  assert.equal(n.products[0].stock, 20);
  assert.equal(n.productions[0].cost, unit * 12);
  assert.ok(
    Math.abs(n.products[0].cost - (oldCost + unit * 12) / 20) < 0.00001,
  );
  assert.equal(n.parts[0].stock, 952);
  assert.throws(
    () =>
      command(n, {
        type: "productionStatus",
        id: sid(50),
        status: "Concluída",
      }),
    /encerrada/,
  );
});
test("checkout recalcula preços e frete; pedido público não registra pagamento", () => {
  const s = demoState();
  s.settings.defaultFreight = 12;
  const requestId = crypto.randomUUID();
  const input = {
    requestId,
    customer: {
      name: "Cliente Teste",
      phone: "15999999999",
      email: "teste@example.com",
      document: "",
      address: "Rua das Aves, 1",
      city: "Sorocaba",
      state: "SP",
      zip: "18000000",
    },
    items: [{ productId: sid(30), quantity: 2 }],
    payment: "Pix",
    website: "",
  };
  const r = checkout(s, input);
  assert.equal(r.order.total, 111.8);
  assert.equal(r.order.sold, false);
  assert.equal(r.order.source, "loja");
  assert.equal(r.state.customers.length, s.customers.length + 1);
  assert.strictEqual(checkout(r.state, input).state, r.state);
});
test("checkout rejeita produto fora da vitrine e campos de preço forjados", () => {
  const s = demoState();
  s.products[0].online = false;
  const input = {
    requestId: crypto.randomUUID(),
    customer: {
      name: "Teste",
      phone: "15999999999",
      email: "teste@example.com",
      document: "",
      address: "Rua Teste, 1",
      city: "Teste",
      state: "SP",
      zip: "18000000",
    },
    items: [{ productId: sid(30), quantity: 1 }],
    payment: "Pix",
  };
  assert.throws(() => checkout(s, input), /indisponível/);
  assert.throws(() => checkout(demoState(), { ...input, total: 0 }));
  assert.throws(() => checkout(demoState(), { ...input, website: "bot" }));
});
test("pedido enviado baixa produtos e registra venda uma vez", () => {
  const s = demoState();
  s.orders = s.orders.slice(1);
  s.products[2].stock = 10;
  s.orders[0].discount = 10;
  s.orders[0].total -= 10;
  const n = command(s, { type: "orderStatus", id: sid(41), status: "Enviado" });
  assert.equal(n.products[2].stock, 5);
  assert.equal(n.sales.at(-1)!.revenue, 164.5);
  const delivered = command(n, {
    type: "orderStatus",
    id: sid(41),
    status: "Entregue",
  });
  assert.equal(delivered.sales.length, n.sales.length);
  assert.throws(
    () => command(n, { type: "orderStatus", id: sid(41), status: "Cancelado" }),
    /somente/,
  );
});
test("reservas FIFO impedem envio usando estoque de pedido anterior", () => {
  const s = demoState();
  s.orders[0].items = [
    {
      productId: sid(30),
      quantity: 8,
      unitPrice: 49.9,
      name: "Balanço Tropical",
    },
  ];
  s.orders[1].items = [
    {
      productId: sid(30),
      quantity: 1,
      unitPrice: 49.9,
      name: "Balanço Tropical",
    },
  ];
  assert.throws(
    () => command(s, { type: "orderStatus", id: sid(41), status: "Enviado" }),
    /reservas/,
  );
  assert.ok(needsForOrder(s, s.orders[1]).length > 0);
  const canceled = command(s, {
    type: "orderStatus",
    id: sid(40),
    status: "Cancelado",
  });
  const sent = command(canceled, {
    type: "orderStatus",
    id: sid(41),
    status: "Enviado",
  });
  assert.equal(sent.products[0].stock, 7);
});
test("exclusão preserva vínculos de fichas e pedidos", () => {
  assert.throws(
    () =>
      command(demoState(), { type: "delete", entity: "parts", id: sid(20) }),
    /vínculos/,
  );
  assert.throws(
    () =>
      command(demoState(), { type: "delete", entity: "customers", id: sid(2) }),
    /vínculos/,
  );
});
test("editar cadastro não sobrescreve estoque nem custo médio", () => {
  const s = demoState();
  const p = {
    ...s.materials[0],
    stock: 99999,
    cost: 999,
    name: "Madeira renovada",
  };
  const n = command(s, { type: "saveMaterial", data: p });
  assert.equal(n.materials[0].stock, s.materials[0].stock);
  assert.equal(n.materials[0].cost, s.materials[0].cost);
});
test("unidades discretas não aceitam fração e datas inválidas são rejeitadas", () => {
  assert.throws(
    () => command(demoState(), { ...buy, materialId: sid(12), quantity: 1.5 }),
    /inteira/,
  );
  assert.throws(
    () => command(demoState(), { ...buy, date: "2026-02-30" }),
    /Data inválida/,
  );
});
test("estado vazio entrega métricas válidas e zero", () => {
  const m = metrics(emptyState());
  assert.equal(m.revenue, 0);
  assert.equal(m.profit, 0);
  assert.equal(m.inventory, 0);
});
test("lucro subtrai perda avulsa sem duplicar perdas de transformação", () => {
  const s = emptyState();
  s.losses = [
    {
      id: sid(900),
      kind: "material",
      itemId: sid(10),
      quantity: 1,
      cost: 10,
      reason: "Quebra",
      date: today(),
      responsible: "Teste",
      notes: "",
    },
    {
      id: sid(901),
      kind: "material",
      itemId: sid(10),
      quantity: 1,
      cost: 20,
      reason: "Corte",
      date: today(),
      responsible: "Teste",
      notes: "",
      transformationId: sid(800),
    },
  ];
  assert.equal(metrics(s).profit, -10);
});

test("rateio de desconto conserva o total em centavos em pedido com vários produtos", () => {
  let s = demoState();
  s.orders = [];
  s.products.forEach((p) => {
    p.price = 0.05;
    p.stock = 10;
  });
  s = command(s, {
    type: "order",
    customerId: sid(2),
    items: s.products.map((p) => ({ productId: p.id, quantity: 1 })),
    date: today(),
    deadline: today(),
    discount: 0.01,
    freight: 0,
    payment: "Pix",
    notes: "",
  });
  const o = s.orders[0];
  const n = command(s, { type: "orderStatus", id: o.id, status: "Enviado" });
  assert.equal(
    n.sales
      .filter((v) => v.orderId === o.id)
      .reduce((sum, v) => sum + Math.round(v.revenue * 100), 0),
    14,
  );
});
