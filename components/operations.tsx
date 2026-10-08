"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowUpRight, Scissors } from "lucide-react";
import { useStore } from "./provider";
import {
  SectionHeader,
  Fields,
  Modal,
  FormFooter,
  Empty,
  Badge,
  submit,
  type Field,
  type Values,
} from "./ui";
import {
  money,
  number,
  dateLabel,
  today,
  productCost,
  productionNeeds,
  activeOrders,
  needsForOrder,
} from "@/lib/engine";
import type { Order, Requirement } from "@/lib/types";
type Operation =
  "compras" | "transformacao" | "perdas" | "producao" | "pedidos";
const copy: Record<Operation, [string, string, string]> = {
  compras: [
    "Compras",
    "Cada entrada, com seu custo real e histórico.",
    "Nova compra",
  ],
  transformacao: [
    "Transformação de materiais",
    "Da madeira às peças. Registre o corte e aproveite cada centímetro.",
    "Registrar transformação",
  ],
  perdas: [
    "Perdas",
    "Conheça os desperdícios para produzir cada vez melhor.",
    "Registrar perda",
  ],
  producao: [
    "Produção",
    "Organize o trabalho e acompanhe o que está ganhando vida.",
    "Nova produção",
  ],
  pedidos: [
    "Pedidos",
    "Do primeiro pedido à última entrega, tudo sob controle.",
    "Novo pedido",
  ],
};
const paymentOptions = [
  "Pix",
  "Dinheiro",
  "Cartão de crédito",
  "Cartão de débito",
  "Transferência",
  "Marketplace",
  "Outro",
].map((v) => ({ value: v, label: v }));
export function OperationPage({
  module,
  initialCreate = false,
}: {
  module: Operation;
  initialCreate?: boolean;
}) {
  const { state, run, busy } = useStore();
  const defaults: Record<Operation, Values> = {
    compras: {
      materialId: "",
      supplierId: "",
      quantity: 1,
      total: 0,
      freight: 0,
      extra: 0,
      date: today(),
      invoice: "",
      notes: "",
    },
    transformacao: {
      materialId: "",
      used: 200,
      lost: 0,
      date: today(),
      responsible: "Proprietária",
      notes: "",
    },
    perdas: {
      kind: "material",
      itemId: "",
      quantity: 1,
      reason: "Corte",
      date: today(),
      responsible: "Proprietária",
      notes: "",
    },
    producao: {
      productId: "",
      quantity: 1,
      date: today(),
      deadline: today(),
      responsible: "Proprietária",
      priority: "Normal",
      orderId: "",
      notes: "",
    },
    pedidos: {
      customerId: "",
      date: today(),
      deadline: today(),
      discount: 0,
      freight: state.settings.defaultFreight,
      payment: "Pix",
      notes: "",
    },
  };
  const [open, setOpen] = useState(initialCreate),
    [values, setValues] = useState<Values>(defaults[module]),
    [lines, setLines] = useState<{ id: string; quantity: number }[]>([
      { id: "", quantity: 1 },
    ]),
    [filter, setFilter] = useState("Todos"),
    [error, setError] = useState("");
  const options = (data: { id: string; name: string }[]) =>
    data.map((v) => ({ value: v.id, label: v.name }));
  const dateFields: Field[] = [
    { key: "date", label: "Data", type: "date", required: true },
    { key: "notes", label: "Observações", type: "textarea" },
  ];
  let fields: Field[] = [];
  if (module === "compras")
    fields = [
      {
        key: "materialId",
        label: "Material",
        type: "select",
        required: true,
        options: options(state.materials),
      },
      {
        key: "supplierId",
        label: "Fornecedor",
        type: "select",
        options: options(state.suppliers),
      },
      {
        key: "quantity",
        label: "Quantidade na unidade cadastrada",
        type: "number",
        required: true,
        min: 0.001,
        hint: "Madeira em cm, corda em m: informe o total nesta unidade.",
      },
      {
        key: "total",
        label: "Valor dos materiais (R$)",
        type: "number",
        required: true,
      },
      { key: "freight", label: "Frete da compra (R$)", type: "number" },
      { key: "extra", label: "Outros custos (R$)", type: "number" },
      { key: "invoice", label: "Número da nota" },
      ...dateFields,
    ];
  if (module === "transformacao")
    fields = [
      {
        key: "materialId",
        label: "Madeira de origem (cm)",
        type: "select",
        required: true,
        options: options(state.materials.filter((v) => v.unit === "cm")),
      },
      {
        key: "used",
        label: "Madeira utilizada (cm)",
        type: "number",
        required: true,
        min: 0.001,
      },
      {
        key: "lost",
        label: "Perda total (cm)",
        type: "number",
        required: true,
      },
      { key: "responsible", label: "Responsável", required: true },
      ...dateFields,
    ];
  if (module === "perdas") {
    const kind = values.kind;
    fields = [
      {
        key: "kind",
        label: "Tipo de item",
        type: "select",
        required: true,
        options: [
          { value: "material", label: "Matéria-prima" },
          { value: "part", label: "Peça" },
          { value: "product", label: "Brinquedo" },
        ],
      },
      {
        key: "itemId",
        label: "Item",
        type: "select",
        required: true,
        options: options(
          kind === "material"
            ? state.materials
            : kind === "part"
              ? state.parts
              : state.products,
        ),
      },
      {
        key: "quantity",
        label: "Quantidade perdida",
        type: "number",
        min: 0.001,
        required: true,
      },
      {
        key: "reason",
        label: "Motivo",
        type: "select",
        required: true,
        options: [
          "Corte",
          "Quebra",
          "Defeito",
          "Erro",
          "Sobra",
          "Descarte",
          "Outro",
        ].map((v) => ({ value: v, label: v })),
      },
      { key: "responsible", label: "Responsável", required: true },
      ...dateFields,
    ];
  }
  if (module === "producao")
    fields = [
      {
        key: "productId",
        label: "Brinquedo",
        type: "select",
        required: true,
        options: options(state.products),
      },
      {
        key: "quantity",
        label: "Quantidade",
        type: "number",
        required: true,
        step: "1",
        min: 1,
      },
      { key: "responsible", label: "Responsável", required: true },
      {
        key: "priority",
        label: "Prioridade",
        type: "select",
        required: true,
        options: ["Normal", "Alta", "Urgente"].map((v) => ({
          value: v,
          label: v,
        })),
      },
      { key: "deadline", label: "Prazo", type: "date", required: true },
      {
        key: "orderId",
        label: "Pedido relacionado (opcional)",
        type: "select",
        options: activeOrders(state).map((v) => ({
          value: v.id,
          label: "#" + v.number,
        })),
      },
      ...dateFields,
    ];
  if (module === "pedidos")
    fields = [
      {
        key: "customerId",
        label: "Cliente",
        type: "select",
        required: true,
        options: options(state.customers),
      },
      { key: "deadline", label: "Prazo", type: "date", required: true },
      { key: "discount", label: "Desconto total (R$)", type: "number" },
      { key: "freight", label: "Frete (R$)", type: "number" },
      {
        key: "payment",
        label: "Forma de pagamento",
        type: "select",
        required: true,
        options: paymentOptions,
      },
      ...dateFields,
    ];
  const start = () => {
    setValues(defaults[module]);
    setLines([{ id: "", quantity: 1 }]);
    setError("");
    setOpen(true);
  };
  async function save() {
    try {
      const type =
        module === "compras"
          ? "purchase"
          : module === "transformacao"
            ? "transform"
            : module === "perdas"
              ? "loss"
              : module === "producao"
                ? "production"
                : "order";
      await run({
        type,
        ...values,
        ...(module === "transformacao"
          ? {
              outputs: lines.map((l) => ({
                partId: l.id,
                quantity: l.quantity,
              })),
            }
          : module === "pedidos"
            ? {
                items: lines.map((l) => ({
                  productId: l.id,
                  quantity: l.quantity,
                })),
              }
            : {}),
      });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  }
  const total =
    module === "compras"
      ? Number(values.total) + Number(values.freight) + Number(values.extra)
      : module === "pedidos"
        ? lines.reduce(
            (n, l) =>
              n +
              (state.products.find((p) => p.id === l.id)?.price || 0) *
                l.quantity,
            0,
          ) -
          Number(values.discount) +
          Number(values.freight)
        : 0;
  const usedInPieces = lines.reduce(
    (n, l) =>
      n + (state.parts.find((p) => p.id === l.id)?.length || 0) * l.quantity,
    0,
  );
  const pending = activeOrders(state);
  const records =
    module === "compras"
      ? state.purchases
      : module === "transformacao"
        ? state.transformations
        : module === "perdas"
          ? state.losses
          : module === "producao"
            ? state.productions
            : state.orders;
  const requirements =
    module === "producao" || module === "pedidos"
      ? productionNeeds(
          state,
          pending.flatMap((o) => o.items),
        )
      : [];
  return (
    <>
      <SectionHeader
        title={copy[module][0]}
        description={copy[module][1]}
        action={start}
        actionLabel={copy[module][2]}
      />
      {module === "producao" ? (
        <section className="panel planning">
          <div className="card-title">
            <div>
              <h2>O que os pedidos precisam?</h2>
              <p className="muted">
                Necessidade acumulada dos pedidos abertos, descontando os
                brinquedos prontos.
              </p>
            </div>
            <Scissors size={26} />
          </div>
          <RequirementList rows={requirements} />
        </section>
      ) : null}
      {module === "perdas" ? (
        <div className="mini-metrics">
          <div className="panel">
            <small>Custo das perdas neste mês</small>
            <strong>
              {money(
                state.losses
                  .filter((v) => v.date.startsWith(today().slice(0, 7)))
                  .reduce((n, v) => n + v.cost, 0),
              )}
            </strong>
          </div>
          <div className="panel">
            <small>Perda média ponderada nos cortes</small>
            <strong>
              {number(
                state.transformations.length
                  ? (state.transformations.reduce((n, v) => n + v.lost, 0) /
                      state.transformations.reduce((n, v) => n + v.used, 0)) *
                      100
                  : 0,
              )}
              %
            </strong>
          </div>
        </div>
      ) : null}
      {module === "producao" || module === "pedidos" ? (
        <div className="tabs">
          {["Todos", "Em aberto", "Concluídos"].map((v) => (
            <button
              key={v}
              className={filter === v ? "active" : ""}
              onClick={() => setFilter(v)}
            >
              {v}
            </button>
          ))}
        </div>
      ) : null}
      {!records.length ? (
        <Empty />
      ) : (
        <div className="panel data-list">
          {module === "pedidos"
            ? state.orders
                .filter(
                  (o) =>
                    filter === "Todos" ||
                    (filter === "Em aberto"
                      ? !["Entregue", "Cancelado", "Enviado"].includes(o.status)
                      : ["Entregue", "Enviado"].includes(o.status)),
                )
                .slice()
                .reverse()
                .map((o) => (
                  <Link
                    className="order-summary"
                    href={"/painel/pedidos/" + o.id}
                    key={o.id}
                  >
                    <span className="order-number">#{o.number}</span>
                    <div>
                      <strong>
                        {state.customers.find((c) => c.id === o.customerId)
                          ?.name || "Cliente"}
                      </strong>
                      <small>
                        {o.items.reduce((n, l) => n + l.quantity, 0)} unidades •{" "}
                        {dateLabel(o.date)} •{" "}
                        {o.source === "loja" ? "Loja virtual" : "Painel"}
                      </small>
                    </div>
                    <Badge
                      tone={
                        o.status === "Cancelado"
                          ? "neutral"
                          : o.sold
                            ? "sage"
                            : "wood"
                      }
                    >
                      {o.status}
                    </Badge>
                    <b>{money(o.total)}</b>
                    <ArrowUpRight size={17} />
                  </Link>
                ))
            : module === "producao"
              ? state.productions
                  .filter(
                    (p) =>
                      filter === "Todos" ||
                      (filter === "Em aberto"
                        ? !["Concluída", "Cancelada"].includes(p.status)
                        : p.status === "Concluída"),
                  )
                  .slice()
                  .reverse()
                  .map((p) => (
                    <div className="operation-row" key={p.id}>
                      <div>
                        <strong>
                          {p.quantity} ×{" "}
                          {
                            state.products.find((v) => v.id === p.productId)
                              ?.name
                          }
                        </strong>
                        <small>
                          {p.responsible} • prazo {dateLabel(p.deadline)} •{" "}
                          {p.priority}
                        </small>
                      </div>
                      <Badge tone={p.status === "Concluída" ? "sage" : "wood"}>
                        {p.status}
                      </Badge>
                      <strong>
                        {p.cost
                          ? money(p.cost)
                          : money(
                              (state.products.find((v) => v.id === p.productId)
                                ? productCost(
                                    state,
                                    state.products.find(
                                      (v) => v.id === p.productId,
                                    )!,
                                  )
                                : 0) * p.quantity,
                            )}
                      </strong>
                      {!["Concluída", "Cancelada"].includes(p.status) ? (
                        <select
                          aria-label="Atualizar status da produção"
                          value={p.status}
                          disabled={busy}
                          onChange={async (e) => {
                            try {
                              await run({
                                type: "productionStatus",
                                id: p.id,
                                status: e.target.value,
                              });
                            } catch {
                              /* provider */
                            }
                          }}
                        >
                          {[
                            "Planejada",
                            "Em andamento",
                            "Pausada",
                            "Concluída",
                            "Cancelada",
                          ].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  ))
              : module === "compras"
                ? state.purchases
                    .slice()
                    .reverse()
                    .map((p) => (
                      <div className="operation-row" key={p.id}>
                        <div>
                          <strong>
                            {
                              state.materials.find((v) => v.id === p.materialId)
                                ?.name
                            }
                          </strong>
                          <small>
                            {number(p.quantity)}{" "}
                            {
                              state.materials.find((v) => v.id === p.materialId)
                                ?.unit
                            }{" "}
                            • {dateLabel(p.date)} •{" "}
                            {state.suppliers.find((v) => v.id === p.supplierId)
                              ?.name || "Sem fornecedor"}
                          </small>
                        </div>
                        <strong>{money(p.total + p.freight + p.extra)}</strong>
                        <span>
                          {money(p.unitCost)} /{" "}
                          {
                            state.materials.find((v) => v.id === p.materialId)
                              ?.unit
                          }
                        </span>
                        <Badge tone="sage">Recebida</Badge>
                      </div>
                    ))
                : module === "transformacao"
                  ? state.transformations
                      .slice()
                      .reverse()
                      .map((t) => (
                        <div className="operation-row" key={t.id}>
                          <div>
                            <strong>
                              {
                                state.materials.find(
                                  (v) => v.id === t.materialId,
                                )?.name
                              }
                            </strong>
                            <small>
                              {dateLabel(t.date)} • {t.responsible}
                            </small>
                          </div>
                          <div>
                            {number(t.used)} cm usados
                            <small>
                              {t.outputs
                                .map(
                                  (o) =>
                                    o.quantity +
                                    " × " +
                                    state.parts.find((p) => p.id === o.partId)
                                      ?.name,
                                )
                                .join(" · ")}
                            </small>
                          </div>
                          <Badge tone="coral">
                            {number(t.lost)} cm de perda
                          </Badge>
                          <strong>{money(t.totalCost)}</strong>
                        </div>
                      ))
                  : state.losses
                      .slice()
                      .reverse()
                      .map((l) => (
                        <div className="operation-row" key={l.id}>
                          <div>
                            <strong>
                              {
                                [
                                  ...state.materials,
                                  ...state.parts,
                                  ...state.products,
                                ].find((v) => v.id === l.itemId)?.name
                              }
                            </strong>
                            <small>
                              {dateLabel(l.date)} • {l.reason} • {l.responsible}
                            </small>
                          </div>
                          <span>
                            {number(l.quantity)}{" "}
                            {
                              [
                                ...state.materials,
                                ...state.parts,
                                ...state.products,
                              ].find((v) => v.id === l.itemId)?.unit
                            }
                          </span>
                          <strong>{money(l.cost)}</strong>
                          <Badge tone="coral">
                            {l.transformationId
                              ? "Incluída no corte"
                              : "Perda registrada"}
                          </Badge>
                        </div>
                      ))}
        </div>
      )}
      {open ? (
        <Modal title={copy[module][2]} onClose={() => setOpen(false)}>
          <form onSubmit={submit(save)}>
            {error ? <div className="error">{error}</div> : null}
            <Fields
              fields={fields}
              values={values}
              onChange={(v) => {
                if (v.kind !== values.kind) v.itemId = "";
                setValues(v);
              }}
            />
            {module === "transformacao" || module === "pedidos" ? (
              <div className="recipe-editor">
                <div className="card-title">
                  <h3>
                    {module === "transformacao"
                      ? "Peças produzidas"
                      : "Brinquedos do pedido"}
                  </h3>
                  <button
                    className="btn small"
                    type="button"
                    onClick={() =>
                      setLines([...lines, { id: "", quantity: 1 }])
                    }
                  >
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>
                {lines.map((l, i) => (
                  <div className="recipe-row simple" key={i}>
                    <select
                      aria-label="Selecionar item"
                      required
                      value={l.id}
                      onChange={(e) =>
                        setLines(
                          lines.map((v, j) =>
                            i === j ? { ...v, id: e.target.value } : v,
                          ),
                        )
                      }
                    >
                      <option value="">Selecione</option>
                      {(module === "transformacao"
                        ? state.parts.filter(
                            (p) => p.materialId === values.materialId,
                          )
                        : state.products.filter((p) => p.active)
                      ).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label="Quantidade"
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={l.quantity}
                      onChange={(e) =>
                        setLines(
                          lines.map((v, j) =>
                            i === j
                              ? { ...v, quantity: Number(e.target.value) }
                              : v,
                          ),
                        )
                      }
                    />
                    <button
                      className="icon-btn danger"
                      type="button"
                      aria-label="Remover item"
                      onClick={() => setLines(lines.filter((_, j) => i !== j))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {module === "transformacao" ? (
              <div className="calculation">
                <span>
                  Peças: {number(usedInPieces)} cm + perda:{" "}
                  {number(Number(values.lost))} cm
                </span>
                <b>
                  {Math.abs(
                    usedInPieces + Number(values.lost) - Number(values.used),
                  ) < 0.001
                    ? "Comprimento conferido ✓"
                    : "Diferença: " +
                      number(
                        Number(values.used) -
                          usedInPieces -
                          Number(values.lost),
                      ) +
                      " cm"}
                </b>
                <small>
                  O custo da perda é absorvido pelas peças úteis,
                  proporcionalmente ao comprimento.
                </small>
              </div>
            ) : module === "compras" || module === "pedidos" ? (
              <div className="calculation">
                <span>
                  Total da {module === "compras" ? "compra" : "venda"}
                </span>
                <strong>{money(total)}</strong>
                {module === "compras" ? (
                  <small>
                    Custo unitário:{" "}
                    {money(total / Math.max(0.0001, Number(values.quantity)))}
                  </small>
                ) : null}
              </div>
            ) : null}
            <FormFooter busy={busy} onClose={() => setOpen(false)} />
          </form>
        </Modal>
      ) : null}
    </>
  );
}
export function RequirementList({ rows }: { rows: Requirement[] }) {
  const { state } = useStore();
  if (!rows.length)
    return (
      <p className="all-good">Os brinquedos em estoque atendem à demanda.</p>
    );
  return (
    <div className="requirements">
      {rows.map((r) => (
        <div className="requirement-row" key={r.kind + r.itemId}>
          <div>
            <strong>{r.name}</strong>
            <small>
              {r.kind === "part"
                ? "Peça intermediária"
                : "Matéria-prima / insumo"}
            </small>
          </div>
          <div>
            <small>Necessário</small>
            <strong>
              {number(r.required)} {r.unit}
            </strong>
          </div>
          <div>
            <small>Disponível</small>
            <strong>
              {number(r.available)} {r.unit}
            </strong>
          </div>
          <div>
            <Badge
              tone={
                r.action === "Comprar"
                  ? "coral"
                  : r.action === "Produzir"
                    ? "wood"
                    : "sage"
              }
            >
              {r.action}
            </Badge>
            <small>
              {r.missing > 0
                ? "Faltam " + number(r.missing) + " " + r.unit
                : "Estoque suficiente"}
            </small>
            {r.kind === "part" && r.missing > 0 ? (
              <small>
                Madeira:{" "}
                {number(
                  (r.missing *
                    (state.parts.find((p) => p.id === r.itemId)?.length || 0)) /
                    (1 - state.settings.lossRate / 100),
                )}{" "}
                cm
              </small>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
export function OrderDetail({ id }: { id: string }) {
  const { state, run, busy, notify } = useStore();
  const o = state.orders.find((o) => o.id === id);
  if (!o) return <Empty title="Pedido não encontrado" />;
  const requirements = needsForOrder(state, o);
  const customer = state.customers.find((c) => c.id === o.customerId);
  async function downloadList() {
    const { exportRows } = await import("@/lib/export");
    await exportRows(
      "Lista de compras pedido " + o!.number,
      requirements
        .filter((r) => r.kind === "material" && r.missing > 0)
        .map((r) => ({
          Material: r.name,
          Quantidade: r.missing,
          Unidade: r.unit,
        })),
      "csv",
    );
    notify("Lista de compras exportada.");
  }
  return (
    <>
      <SectionHeader
        eyebrow="CADA PEDIDO, UMA NOVA HISTÓRIA"
        title={"Pedido #" + o.number}
        description={
          (customer?.name || "Cliente") + " • prazo " + dateLabel(o.deadline)
        }
      />
      <div className="detail-grid">
        <section className="panel">
          <div className="card-title">
            <h2>Brinquedos do pedido</h2>
            <Badge tone="wood">{o.status}</Badge>
          </div>
          {o.items.map((l) => {
            const p = state.products.find((v) => v.id === l.productId)!;
            const alreadyBefore = activeOrders(state)
              .filter((a) => a.number < o.number)
              .flatMap((a) => a.items)
              .filter((a) => a.productId === l.productId)
              .reduce((n, a) => n + a.quantity, 0);
            const done = o.sold
              ? l.quantity
              : Math.min(l.quantity, Math.max(0, p.stock - alreadyBefore));
            return (
              <div className="order-product" key={l.productId}>
                <img src={p.image || "/images/balanco.svg"} alt="" />
                <div>
                  <strong>
                    {l.quantity} × {l.name}
                  </strong>
                  <small>{money(l.unitPrice)} por unidade</small>
                  <div className="progress">
                    <i style={{ width: (done / l.quantity) * 100 + "%" }} />
                  </div>
                  <small>
                    {done} / {l.quantity} prontos{" "}
                    {o.sold ? "e enviados" : "disponíveis para este pedido"}
                  </small>
                </div>
                <b>{money(l.unitPrice * l.quantity)}</b>
              </div>
            );
          })}
          <div className="totals">
            <p>
              Desconto <b>− {money(o.discount)}</b>
            </p>
            <p>
              Frete <b>{money(o.freight)}</b>
            </p>
            <p className="total">
              Total <b>{money(o.total)}</b>
            </p>
          </div>
        </section>
        <section className="panel">
          <h2>Próximos passos</h2>
          <p className="muted">
            Ao marcar como enviado, os brinquedos saem do estoque e a venda é
            registrada.
          </p>
          <label className="stack-label">
            Situação do pedido
            <select
              value={o.status}
              disabled={busy || ["Cancelado", "Entregue"].includes(o.status)}
              onChange={async (e) => {
                try {
                  await run({
                    type: "orderStatus",
                    id: o.id,
                    status: e.target.value,
                  });
                } catch {
                  /* provider */
                }
              }}
            >
              {(o.sold
                ? ["Enviado", "Entregue"]
                : [
                    "Novo",
                    "Aguardando produção",
                    "Em produção",
                    "Pronto",
                    "Enviado",
                    "Cancelado",
                  ]
              ).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <p>
            <b>Pagamento:</b> {o.payment}
          </p>
          <p>
            <b>Cliente:</b> {customer?.phone || "Sem telefone"}
          </p>
          <p className="muted">
            {customer?.address} {customer?.city} {customer?.state}{" "}
            {customer?.zip}
          </p>
          {o.notes && !o.notes.startsWith("checkout:") ? (
            <p>{o.notes}</p>
          ) : null}
          <button className="btn" onClick={downloadList}>
            Gerar lista de compras
          </button>
          {!o.sold && o.status !== "Cancelado" ? (
            <button
              className="btn primary"
              disabled={busy}
              onClick={async () => {
                try {
                  for (const l of o.items) {
                    const before = activeOrders(state)
                      .filter((a) => a.number < o.number)
                      .flatMap((a) => a.items)
                      .filter((a) => a.productId === l.productId)
                      .reduce((n, a) => n + a.quantity, 0);
                    const p = state.products.find((p) => p.id === l.productId)!;
                    const existing = state.productions
                      .filter(
                        (p) =>
                          p.orderId === o.id &&
                          p.productId === l.productId &&
                          !["Concluída", "Cancelada"].includes(p.status),
                      )
                      .reduce((n, p) => n + p.quantity, 0);
                    const quantity = Math.max(
                      0,
                      l.quantity - Math.max(0, p.stock - before) - existing,
                    );
                    if (quantity)
                      await run({
                        type: "production",
                        productId: l.productId,
                        quantity,
                        date: today(),
                        deadline: o.deadline < today() ? today() : o.deadline,
                        responsible: "Proprietária",
                        priority: "Alta",
                        orderId: o.id,
                        notes: "Gerada pelo pedido #" + o.number,
                      });
                  }
                  notify("Planejamento atualizado. Veja o módulo Produção.");
                } catch {
                  /* provider */
                }
              }}
            >
              Gerar ordens de produção
            </button>
          ) : null}
          <Link className="text-link" href="/painel/pedidos">
            ← Voltar aos pedidos
          </Link>
        </section>
      </div>
      {!o.sold && o.status !== "Cancelado" ? (
        <section className="panel planning">
          <div className="card-title">
            <div>
              <h2>O que precisamos para este pedido?</h2>
              <p className="muted">
                Considera produtos reservados por pedidos anteriores. Insumos
                são estimados com perda de {state.settings.lossRate}%.
              </p>
            </div>
          </div>
          <RequirementList rows={requirements} />
          <p className="muted">
            Para compras compartilhadas entre pedidos, consulte a necessidade
            acumulada em Produção.
          </p>
        </section>
      ) : null}
    </>
  );
}
