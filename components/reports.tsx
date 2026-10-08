"use client";
import { useState } from "react";
import { Download, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useStore } from "./provider";
import {
  SectionHeader,
  Badge,
  Empty,
  Fields,
  Modal,
  FormFooter,
  submit,
  type Values,
  type Field,
} from "./ui";
import {
  money,
  number,
  today,
  dateLabel,
  productCost,
  suggestedPrice,
  inventoryValue,
  metrics,
} from "@/lib/engine";
import type { Row } from "@/lib/export";
export function InventoryPage() {
  const { state } = useStore();
  const [tab, setTab] = useState("Materiais");
  const items =
    tab === "Materiais"
      ? state.materials
      : tab === "Peças"
        ? state.parts
        : state.products;
  return (
    <>
      <SectionHeader
        title="Estoque"
        description="Saiba o que tem, o que falta e o que está pronto para sair."
      />
      <div className="mini-metrics">
        <div className="panel">
          <small>Dinheiro em estoque</small>
          <strong>{money(inventoryValue(state))}</strong>
        </div>
        <div className="panel">
          <small>Itens abaixo do mínimo</small>
          <strong>
            {
              [...state.materials, ...state.parts, ...state.products].filter(
                (v) => v.stock <= v.minimum,
              ).length
            }
          </strong>
        </div>
      </div>
      <div className="tabs">
        {["Materiais", "Peças", "Brinquedos", "Movimentações"].map((v) => (
          <button
            key={v}
            className={tab === v ? "active" : ""}
            onClick={() => setTab(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="panel data-list">
        {tab === "Movimentações"
          ? state.movements
              .slice()
              .reverse()
              .map((m) => (
                <div className="operation-row" key={m.id}>
                  <div>
                    <strong>{m.name}</strong>
                    <small>
                      {dateLabel(m.date)} • {m.responsible} • {m.reason}
                    </small>
                  </div>
                  <Badge tone={m.quantity > 0 ? "sage" : "coral"}>
                    {m.quantity > 0 ? "+" : ""}
                    {number(m.quantity)} {m.unit}
                  </Badge>
                  <div>
                    <small>Saldo após operação</small>
                    <b>
                      {number(m.balance)} {m.unit}
                    </b>
                  </div>
                  <span>
                    {money(m.unitCost)} / {m.unit}
                  </span>
                </div>
              ))
          : items.map((v) => (
              <div className="operation-row" key={v.id}>
                <div>
                  <strong>{v.name}</strong>
                  <small>
                    {v.sku} • mínimo {v.minimum} {v.unit}
                  </small>
                </div>
                <b>
                  {number(v.stock)} {v.unit}
                </b>
                <span>{money(v.stock * v.cost)}</span>
                <Badge tone={v.stock <= v.minimum ? "coral" : "sage"}>
                  {v.stock <= v.minimum ? "Estoque baixo" : "Em dia"}
                </Badge>
              </div>
            ))}
        {tab === "Movimentações" && !state.movements.length ? (
          <Empty description="As compras, cortes, produções e perdas aparecem aqui automaticamente." />
        ) : null}
      </div>
    </>
  );
}
export function PricingPage() {
  const { state, run, busy } = useStore();
  const [id, setId] = useState(state.products[0]?.id || ""),
    [margin, setMargin] = useState(50),
    [discount, setDiscount] = useState(0);
  const p = state.products.find((p) => p.id === id);
  const taxes =
    state.settings.taxRate +
    state.settings.feeRate +
    state.settings.commissionRate;
  const cost = p ? productCost(state, p) : 0;
  let price = 0,
    error = "";
  try {
    price = suggestedPrice(cost, margin, taxes, discount);
  } catch (e) {
    error = e instanceof Error ? e.message : "Valores inválidos.";
  }
  return (
    <>
      <SectionHeader
        title="Precificação"
        description="O preço certo valoriza o seu tempo e o seu trabalho."
      />
      {!p ? (
        <Empty description="Cadastre um brinquedo e sua ficha técnica para simular preços." />
      ) : (
        <div className="detail-grid">
          <section className="panel">
            <label className="stack-label">
              Brinquedo
              <select value={id} onChange={(e) => setId(e.target.value)}>
                {state.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="cost-breakdown">
              <p>
                Materiais e peças{" "}
                <b>{money(cost - p.labor - p.overhead - p.extra)}</b>
              </p>
              <p>
                Mão de obra <b>{money(p.labor)}</b>
              </p>
              <p>
                Custo fixo proporcional <b>{money(p.overhead)}</b>
              </p>
              <p>
                Adicionais <b>{money(p.extra)}</b>
              </p>
              <p className="total">
                Custo total <b>{money(cost)}</b>
              </p>
            </div>
            <small className="muted">
              Custo teórico atualizado com os custos médios atuais. Estoque
              pronto mantém seu custo histórico.
            </small>
            <label className="stack-label">
              Margem desejada sobre a venda (%)
              <input
                type="number"
                value={margin}
                min="0"
                max="99"
                onChange={(e) => setMargin(Number(e.target.value))}
              />
            </label>
            <label className="stack-label">
              Desconto previsto (%)
              <input
                type="number"
                value={discount}
                min="0"
                max="99"
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </label>
            <p className="muted">
              Taxas + impostos + comissão: {number(taxes)}%. Altere em
              Configurações.
            </p>
            <code className="formula">
              Preço = custo ÷ (1 − margem − taxas) ÷ (1 − desconto)
            </code>
          </section>
          <section className="panel price-panel">
            <span className="eyebrow">SEU TRABALHO TEM VALOR</span>
            <h2>Preço sugerido</h2>
            {error ? (
              <div className="error">{error}</div>
            ) : (
              <>
                <strong className="big-price">{money(price)}</strong>
                <p>
                  Margem de {margin}% após taxas, sobre o valor recebido com
                  desconto.
                </p>
                <button
                  className="btn primary"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await run({ type: "price", productId: p.id, price });
                    } catch {
                      /* provider */
                    }
                  }}
                >
                  Aplicar preço ao brinquedo
                </button>
              </>
            )}
            <h3>Experimente outras margens</h3>
            <div className="price-scenarios">
              {[30, 40, 50, 60].map((m) => {
                let value = 0;
                try {
                  value = suggestedPrice(cost, m, taxes, discount);
                } catch {
                  /* invalid scenario */
                }
                return (
                  <button
                    className={m === margin ? "active" : ""}
                    key={m}
                    disabled={!value}
                    onClick={() => setMargin(m)}
                  >
                    <span>{m}%</span>
                    <b>{value ? money(value) : "Indisponível"}</b>
                  </button>
                );
              })}
            </div>
            <p className="muted">
              Preço atual: {money(p.price)} · desconto simulado não altera
              pedidos existentes.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
export function RecipesPage() {
  const { state } = useStore();
  const [id, setId] = useState(state.products[0]?.id || "");
  const p = state.products.find((v) => v.id === id);
  return (
    <>
      <SectionHeader
        title="Ficha técnica"
        description="Tudo o que cada brinquedo precisa, com custos atualizados."
      />
      {!p ? (
        <Empty />
      ) : (
        <>
          <div className="toolbar">
            <select
              aria-label="Selecionar brinquedo"
              value={id}
              onChange={(e) => setId(e.target.value)}
            >
              {state.products.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <Link
              className="btn"
              href={"/painel/brinquedos?busca=" + encodeURIComponent(p.name)}
            >
              Editar brinquedo e ficha <ArrowUpRight size={16} />
            </Link>
          </div>
          <section className="panel">
            <div className="card-title">
              <h2>{p.name}</h2>
              <Badge tone="wood">
                {money(productCost(state, p))} por unidade
              </Badge>
            </div>
            {p.recipe.map((r, i) => {
              const v = (
                r.kind === "part" ? state.parts : state.materials
              ).find((v) => v.id === r.itemId)!;
              return (
                <div className="operation-row" key={i}>
                  <div>
                    <strong>{v.name}</strong>
                    <small>{r.kind === "part" ? "Peça" : "Material"}</small>
                  </div>
                  <span>
                    {number(r.quantity)} {v.unit}
                  </span>
                  <span>
                    {money(v.cost)} / {v.unit}
                  </span>
                  <strong>{money(v.cost * r.quantity)}</strong>
                </div>
              );
            })}
            <div className="cost-breakdown">
              <p>
                Mão de obra <b>{money(p.labor)}</b>
              </p>
              <p>
                Custo fixo proporcional <b>{money(p.overhead)}</b>
              </p>
              <p>
                Adicionais <b>{money(p.extra)}</b>
              </p>
              <p className="total">
                Custo total <b>{money(productCost(state, p))}</b>
              </p>
            </div>
          </section>
        </>
      )}
    </>
  );
}
export function ReportsPage({ salesOnly = false }: { salesOnly?: boolean }) {
  const { state, notify } = useStore();
  const [report, setReport] = useState(salesOnly ? "Vendas" : "Financeiro"),
    [from, setFrom] = useState(today().slice(0, 7) + "-01"),
    [to, setTo] = useState(today()),
    [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("pdf"),
    [exporting, setExporting] = useState(false);
  const inside = (d: string) => d >= from && d <= to;
  const sales = state.sales.filter((v) => inside(v.date));
  const revenue = sales.reduce((n, v) => n + v.revenue, 0),
    profit =
      sales.reduce((n, v) => n + v.profit, 0) -
      state.expenses
        .filter((v) => inside(v.date))
        .reduce((n, v) => n + v.amount, 0) -
      state.losses
        .filter((v) => inside(v.date) && !v.transformationId)
        .reduce((n, v) => n + v.cost, 0);
  let rows: Row[] = [];
  if (report === "Financeiro")
    rows = [
      { Indicador: "Faturamento de produtos", Valor: revenue },
      {
        Indicador: "Custo dos produtos vendidos",
        Valor: sales.reduce((n, v) => n + v.cost, 0),
      },
      {
        Indicador: "Despesas do período",
        Valor: state.expenses
          .filter((v) => inside(v.date))
          .reduce((n, v) => n + v.amount, 0),
      },
      { Indicador: "Lucro estimado após taxas e despesas", Valor: profit },
      {
        Indicador: "Perdas registradas (informativo)",
        Valor: state.losses
          .filter((v) => inside(v.date))
          .reduce((n, v) => n + v.cost, 0),
      },
    ];
  if (report === "Vendas")
    rows = sales.map((v) => ({
      Data: dateLabel(v.date),
      Produto: v.name,
      Quantidade: v.quantity,
      Faturamento: v.revenue,
      Custo: v.cost,
      Lucro: v.profit,
      Pagamento: v.payment,
    }));
  if (report === "Estoque")
    rows = [...state.materials, ...state.parts, ...state.products].map((v) => ({
      Item: v.name,
      SKU: v.sku,
      Quantidade: v.stock,
      Unidade: v.unit,
      "Custo unitário": v.cost,
      "Valor em estoque": v.cost * v.stock,
      Situação: v.stock <= v.minimum ? "Estoque baixo" : "Em dia",
    }));
  if (report === "Compras")
    rows = state.purchases
      .filter((v) => inside(v.date))
      .map((v) => ({
        Data: dateLabel(v.date),
        Material:
          state.materials.find((m) => m.id === v.materialId)?.name || "",
        Fornecedor:
          state.suppliers.find((s) => s.id === v.supplierId)?.name || "",
        Quantidade: v.quantity,
        Total: v.total + v.freight + v.extra,
      }));
  if (report === "Produção")
    rows = state.productions
      .filter((v) => inside(v.date))
      .map((v) => ({
        Data: dateLabel(v.date),
        Brinquedo: state.products.find((p) => p.id === v.productId)?.name || "",
        Quantidade: v.quantity,
        Custo: v.cost,
        Responsável: v.responsible,
        Situação: v.status,
      }));
  if (report === "Perdas")
    rows = state.losses
      .filter((v) => inside(v.date))
      .map((v) => ({
        Data: dateLabel(v.date),
        Item:
          [...state.materials, ...state.parts, ...state.products].find(
            (p) => p.id === v.itemId,
          )?.name || "",
        Quantidade: v.quantity,
        Motivo: v.reason,
        Custo: v.cost,
      }));
  const top = state.products
    .map((p) => ({
      name: p.name,
      qty: sales
        .filter((s) => s.productId === p.id)
        .reduce((n, v) => n + v.quantity, 0),
    }))
    .sort((a, b) => b.qty - a.qty)
    .filter((p) => p.qty > 0);
  return (
    <>
      <SectionHeader
        title={salesOnly ? "Vendas" : "Relatórios"}
        description="Transforme os números em decisões para o seu negócio."
      />
      <div className="mini-metrics">
        <div className="panel">
          <small>Faturamento no período</small>
          <strong>{money(revenue)}</strong>
        </div>
        <div className="panel">
          <small>Lucro estimado</small>
          <strong>{money(profit)}</strong>
        </div>
        <div className="panel">
          <small>Ticket médio de produtos</small>
          <strong>
            {money(
              revenue / Math.max(1, new Set(sales.map((v) => v.orderId)).size),
            )}
          </strong>
        </div>
      </div>
      <div className="panel report-toolbar">
        <label>
          Relatório
          <select
            aria-label="Relatório"
            value={report}
            onChange={(e) => setReport(e.target.value)}
          >
            {[
              "Financeiro",
              "Vendas",
              "Produção",
              "Estoque",
              "Compras",
              "Perdas",
            ].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          De
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label>
          Formato
          <select
            aria-label="Formato"
            value={format}
            onChange={(e) => setFormat(e.target.value as typeof format)}
          >
            {["pdf", "csv", "xlsx"].map((v) => (
              <option key={v} value={v}>
                {v.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn primary"
          disabled={exporting || from > to || !rows.length}
          onClick={async () => {
            setExporting(true);
            try {
              await (
                await import("@/lib/export")
              ).exportRows(report, rows, format);
              notify("Relatório exportado.");
            } catch {
              notify("Não foi possível exportar. Tente novamente.");
            } finally {
              setExporting(false);
            }
          }}
        >
          <Download size={17} />
          {exporting ? "Gerando…" : "Exportar"}
        </button>
      </div>
      {from > to ? (
        <div className="error">
          A data inicial deve ser anterior à data final.
        </div>
      ) : null}
      <div className="panel report-table">
        <table>
          <thead>
            <tr>
              {Object.keys(rows[0] || {}).map((k) => (
                <th key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {Object.entries(r).map(([k, v]) => (
                  <td key={k}>
                    {typeof v === "number" &&
                    [
                      "Valor",
                      "Custo",
                      "Lucro",
                      "Faturamento",
                      "Total",
                      "Custo unitário",
                      "Valor em estoque",
                    ].includes(k)
                      ? money(v)
                      : typeof v === "number"
                        ? number(v)
                        : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? (
          <Empty description="Não existem registros neste período." />
        ) : null}
      </div>
      <p className="muted">
        Faturamento exclui frete cobrado. Lucro é uma estimativa: despesas podem
        incluir custos fixos já rateados no produto; evite lançá-los duas vezes.
        Perdas de corte já estão absorvidas no custo das peças.
      </p>
      {top.length ? (
        <div className="panel">
          <h2>Brinquedos mais vendidos</h2>
          {top.map((p) => (
            <div className="ranking" key={p.name}>
              <span>{p.name}</span>
              <div>
                <i
                  style={{
                    width: (p.qty / Math.max(1, top[0].qty)) * 100 + "%",
                  }}
                />
              </div>
              <b>{p.qty} un</b>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
export function SettingsPage() {
  const { state, run, busy, demo } = useStore();
  const [values, setValues] = useState<Values>({ ...state.settings }),
    [error, setError] = useState("");
  const fields: Field[] = [
    { key: "name", label: "Nome da loja", required: true },
    { key: "subtitle", label: "Submarca" },
    { key: "phone", label: "WhatsApp da loja" },
    { key: "email", label: "E-mail" },
    { key: "address", label: "Endereço" },
    {
      key: "logo",
      label: "URL da logo original",
      hint: "Cole uma URL HTTPS da sua logo. A marca atual é provisória.",
    },
    {
      key: "lossRate",
      label: "Perda estimada no planejamento (%)",
      type: "number",
      max: 90,
    },
    {
      key: "taxRate",
      label: "Impostos sobre vendas (%)",
      type: "number",
      max: 90,
    },
    {
      key: "feeRate",
      label: "Taxas sobre vendas (%)",
      type: "number",
      max: 90,
    },
    {
      key: "commissionRate",
      label: "Comissões sobre vendas (%)",
      type: "number",
      max: 90,
    },
    { key: "defaultFreight", label: "Frete fixo da loja (R$)", type: "number" },
  ];
  return (
    <>
      <SectionHeader
        title="Configurações"
        description="Seu ateliê, do seu jeito."
      />
      <section className="panel settings-panel">
        <h2>Identidade e regras do negócio</h2>
        <form
          onSubmit={submit(async () => {
            try {
              await run({ type: "settings", data: values });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erro ao salvar.");
            }
          })}
        >
          {error ? <div className="error">{error}</div> : null}
          <Fields fields={fields} values={values} onChange={setValues} />
          <button className="btn primary" disabled={busy} type="submit">
            Salvar configurações
          </button>
        </form>
      </section>
      <section className="panel settings-panel">
        <h2>{demo ? "Conectar o Supabase" : "Sistema conectado"}</h2>
        <p>
          {demo
            ? "Para usar com dados reais e em vários dispositivos, execute supabase/setup.sql, autorize seu usuário em grant-admin.sql e preencha o .env.local conforme o README. Reinicie o servidor."
            : "Os dados são gravados no Supabase. Administradores são gerenciados pelo SQL, sem cadastro público."}
        </p>
        <p className="muted">
          PWA: no celular, abra o site em HTTPS e use “Adicionar à tela
          inicial”. Operações reais precisam de conexão.
        </p>
      </section>
    </>
  );
}
export function StoreAdmin() {
  const { state } = useStore();
  return (
    <>
      <SectionHeader
        title="Loja virtual"
        description="O seu ateliê também tem uma vitrine online."
      />
      <div className="store-preview panel">
        <div>
          <Badge tone="wood">
            {state.products.filter((p) => p.online && p.active).length}{" "}
            brinquedos na vitrine
          </Badge>
          <h2>
            Diversão natural para
            <br />
            aves mais felizes.
          </h2>
          <p>
            O cliente escolhe os brinquedos e envia seu pedido. Ele aparece
            automaticamente no painel, com o planejamento de produção.
          </p>
          <Link className="btn primary" href="/loja" target="_blank">
            Abrir minha loja <ArrowUpRight size={18} />
          </Link>
          <p className="muted">
            O checkout registra pedidos; pagamento e frete são confirmados pela
            loja. O frete atual é fixo: {money(state.settings.defaultFreight)}.
          </p>
        </div>
        <img
          src="/images/balanco.svg"
          alt="Ilustração de brinquedo artesanal"
        />
      </div>
    </>
  );
}
