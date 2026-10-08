"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Wallet,
  TrendingUp,
  ClipboardList,
  Package,
  Layers,
  Scissors,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { useStore } from "./provider";
import { Badge, SectionHeader } from "./ui";
import {
  metrics,
  money,
  dateLabel,
  activeOrders,
  today,
  number,
} from "@/lib/engine";
export function RevenueChart() {
  const { state } = useStore();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today() + "T12:00:00");
    d.setDate(1);
    d.setMonth(d.getMonth() - 5 + i);
    return {
      label: d.toLocaleDateString("pt-BR", { month: "short" }),
      key: d.toISOString().slice(0, 7),
    };
  });
  const values = months.map((m) => ({ ...m, ...metrics(state, m.key) }));
  const max = Math.max(
    1,
    ...values.map((m) => Math.max(m.revenue, m.revenue - m.profit)),
  );
  return (
    <div className="bar-chart">
      {values.map((v) => (
        <div className="bar-group" key={v.key}>
          <div className="bar-pair">
            <div
              className="bar revenue"
              style={{ height: Math.max(2, (v.revenue / max) * 150) + "px" }}
              title={v.label + ": " + money(v.revenue)}
            >
              <span>{money(v.revenue)}</span>
            </div>
            <div
              className="bar costs"
              style={{
                height:
                  Math.max(2, ((v.revenue - v.profit) / max) * 150) + "px",
              }}
              title={"Custos: " + money(v.revenue - v.profit)}
            />
          </div>
          <small>{v.label}</small>
        </div>
      ))}
    </div>
  );
}
export function Dashboard() {
  const { state } = useStore();
  const m = metrics(state);
  const low = [
    ...state.materials.map((v) => ({ ...v, path: "materiais" })),
    ...state.parts.map((v) => ({ ...v, path: "pecas" })),
    ...state.products.map((v) => ({ ...v, path: "brinquedos" })),
  ].filter((i) => i.stock <= i.minimum);
  const sold = state.products
    .map((p) => ({
      name: p.name,
      qty: state.sales
        .filter(
          (v) => v.productId === p.id && v.date.startsWith(today().slice(0, 7)),
        )
        .reduce((n, v) => n + v.quantity, 0),
    }))
    .sort((a, b) => b.qty - a.qty)
    .filter((v) => v.qty > 0);
  const spending = state.materials
    .map((p) => ({
      name: p.name,
      value: state.purchases
        .filter(
          (v) =>
            v.materialId === p.id && v.date.startsWith(today().slice(0, 7)),
        )
        .reduce((n, v) => n + v.total + v.freight + v.extra, 0),
    }))
    .sort((a, b) => b.value - a.value)
    .filter((v) => v.value > 0);
  const cards = [
    {
      name: "Faturamento do mês",
      value: money(m.revenue),
      icon: Wallet,
      note: "Vendas com envio confirmado",
    },
    {
      name: "Lucro estimado",
      value: money(m.profit),
      icon: TrendingUp,
      note: "Após custos, taxas e despesas",
    },
    {
      name: "Pedidos do mês",
      value: m.orders,
      icon: ClipboardList,
      note: "Seu trabalho chegando mais longe",
    },
    {
      name: "Produtos vendidos",
      value: m.quantity,
      icon: Package,
      note: "Unidades vendidas neste mês",
    },
    {
      name: "Valor em estoque",
      value: money(m.inventory),
      icon: Layers,
      note: "Materiais, peças e brinquedos",
    },
    {
      name: "Produções em andamento",
      value: m.productions,
      icon: Scissors,
      note: "Da ideia ao brinquedo pronto",
    },
  ];
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">
            <Sun size={14} /> CADERNO DO ATELIÊ / VISÃO GERAL
          </p>
          <h1>
            Seu ateliê, em um olhar<span>.</span>
          </h1>
          <p>Da bancada ao pedido enviado. Veja como está a loja hoje.</p>
        </div>
        <div className="date-chip">{dateLabel(today())}</div>
      </div>
      <div className="metric-grid">
        {cards.map((c, i) => (
          <article
            className={"metric " + (i === 0 ? "featured" : "")}
            key={c.name}
          >
            <div>
              <span>{c.name}</span>
              <c.icon size={20} />
            </div>
            <strong>{c.value}</strong>
            <small>{c.note}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="card-title">
            <div>
              <h2>O ritmo do seu negócio</h2>
              <p className="muted">Vendas e custos nos últimos 6 meses</p>
            </div>
            <Badge>Últimos 6 meses</Badge>
          </div>
          <RevenueChart />
          <div className="chart-legend">
            <span>
              <i className="coral-dot" />
              Faturamento
            </span>
            <span>
              <i className="wood-dot" />
              Custos + despesas
            </span>
            <Link href="/painel/relatorios">
              Ver relatório <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
        <section className="panel attention-panel">
          <div className="card-title">
            <h2>Atenção necessária</h2>
            <span className="count-chip">{low.length}</span>
          </div>
          <p className="muted">Um pequeno cuidado, tudo em dia.</p>
          {low.slice(0, 4).map((v) => (
            <Link
              className="attention-row"
              key={v.id}
              href={"/painel/" + v.path}
            >
              <span className="alert-icon">
                <TriangleAlert size={17} />
              </span>
              <div>
                <strong>{v.name}</strong>
                <small>
                  {number(v.stock)} {v.unit} restantes
                </small>
              </div>
              <Badge tone="coral">Baixo</Badge>
            </Link>
          ))}
          {!low.length ? (
            <p className="all-good">Seu estoque está em dia.</p>
          ) : null}
          <Link className="text-link" href="/painel/estoque">
            Conferir meu estoque <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="dashboard-grid bottom">
        <section className="panel">
          <div className="card-title">
            <div>
              <h2>Pedidos que merecem carinho</h2>
              <p className="muted">Os próximos passos do seu ateliê</p>
            </div>
            <Link className="text-link" href="/painel/pedidos">
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>
          {activeOrders(state)
            .slice(0, 4)
            .map((o) => (
              <Link
                className="order-summary"
                key={o.id}
                href={"/painel/pedidos/" + o.id}
              >
                <span className="order-number">#{o.number}</span>
                <div>
                  <strong>
                    {state.customers.find((c) => c.id === o.customerId)?.name}
                  </strong>
                  <small>
                    {o.items.reduce((n, l) => n + l.quantity, 0)} brinquedos ·
                    prazo {dateLabel(o.deadline)}
                  </small>
                </div>
                <Badge tone={o.status === "Novo" ? "wood" : "coral"}>
                  {o.status}
                </Badge>
                <b>{money(o.total)}</b>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          {!activeOrders(state).length ? (
            <p className="muted">Nenhum pedido pendente.</p>
          ) : null}
        </section>
        <section className="craft-card">
          <span className="eyebrow">FEITO À MÃO, GERIDO COM CARINHO</span>
          <Scissors size={40} strokeWidth={1.3} />
          <h2>
            Hora de tirar ideias
            <br />
            do papel.
          </h2>
          <p>Organize sua produção e transforme materiais em diversão.</p>
          <Link className="btn dark" href="/painel/producao">
            Organizar produção <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Favoritos das aves</h2>
          <p className="muted">Brinquedos mais vendidos neste mês</p>
          {sold.length ? (
            sold.slice(0, 5).map((v) => (
              <div className="ranking" key={v.name}>
                <span>{v.name}</span>
                <div>
                  <i
                    style={{
                      width: (v.qty / Math.max(1, sold[0].qty)) * 100 + "%",
                    }}
                  />
                </div>
                <b>{v.qty} un</b>
              </div>
            ))
          ) : (
            <p className="all-good">As primeiras vendas aparecerão aqui.</p>
          )}
        </section>
        <section className="panel">
          <h2>Investimento em materiais</h2>
          <p className="muted">Compras do mês, incluindo frete e adicionais</p>
          {spending.length ? (
            spending.slice(0, 5).map((v) => (
              <div className="ranking" key={v.name}>
                <span>{v.name}</span>
                <div>
                  <i
                    style={{
                      width:
                        (v.value / Math.max(1, spending[0].value)) * 100 + "%",
                    }}
                  />
                </div>
                <b>{money(v.value)}</b>
              </div>
            ))
          ) : (
            <p className="all-good">Nenhuma compra registrada neste mês.</p>
          )}
        </section>
      </div>
    </>
  );
}
