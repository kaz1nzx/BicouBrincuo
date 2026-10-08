"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Layers,
  ShoppingBag,
  Scissors,
  Package,
  ClipboardList,
  Users,
  Truck,
  BarChart3,
  Settings,
  Store,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  Plus,
  ChevronRight,
  Coins,
  TriangleAlert,
} from "lucide-react";
import { Brand } from "./ui";
import { useStore } from "./provider";
import { browserClient } from "@/lib/supabase/client";
import { activeOrders } from "@/lib/engine";
export const links = [
  { name: "Visão geral", path: "", icon: LayoutDashboard },
  { name: "Matérias-primas", path: "materiais", icon: Layers },
  { name: "Compras", path: "compras", icon: ShoppingBag },
  { name: "Peças", path: "pecas", icon: Package },
  { name: "Transformação", path: "transformacao", icon: Scissors },
  { name: "Perdas", path: "perdas", icon: TriangleAlert },
  { name: "Brinquedos", path: "brinquedos", icon: Package },
  { name: "Ficha técnica", path: "ficha-tecnica", icon: ClipboardList },
  { name: "Produção", path: "producao", icon: Scissors },
  { name: "Estoque", path: "estoque", icon: Layers },
  { name: "Pedidos", path: "pedidos", icon: ClipboardList },
  { name: "Clientes", path: "clientes", icon: Users },
  { name: "Vendas", path: "vendas", icon: Coins },
  { name: "Fornecedores", path: "fornecedores", icon: Truck },
  { name: "Custos", path: "custos", icon: Coins },
  { name: "Precificação", path: "precificacao", icon: Coins },
  { name: "Relatórios", path: "relatorios", icon: BarChart3 },
  { name: "Loja virtual", path: "loja-virtual", icon: Store },
  { name: "Configurações", path: "configuracoes", icon: Settings },
];
export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname(),
    router = useRouter();
  const { state, loading, error, message, demo } = useStore();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [notices, setNotices] = useState(false),
    [actions, setActions] = useState(false);
  const low = [...state.materials, ...state.parts, ...state.products].filter(
    (i) => i.stock <= i.minimum,
  );
  const matches =
    search.length > 1
      ? [
          ...state.materials.map((v) => ({ ...v, path: "materiais" })),
          ...state.parts.map((v) => ({ ...v, path: "pecas" })),
          ...state.products.map((v) => ({ ...v, path: "brinquedos" })),
          ...state.customers.map((v) => ({ ...v, path: "clientes" })),
          ...state.suppliers.map((v) => ({ ...v, path: "fornecedores" })),
          ...state.orders.map((v) => ({
            id: v.id,
            name: "Pedido #" + v.number,
            path: "pedidos/" + v.id,
          })),
        ]
          .filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 8)
      : [];
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (open ? "open" : "")}>
        <Link href="/painel">
          <Brand small logo={state.settings.logo} />
        </Link>
        <button
          className="icon-btn close-menu"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        >
          <X />
        </button>
        <div className="workspace">
          <span className="workspace-dot" />
          <div>
            <b>Meu ateliê</b>
            <small>Gestão da sua loja</small>
          </div>
          <ChevronRight size={16} />
        </div>
        <nav>
          {links.map((l, i) => (
            <div key={l.path}>
              {[1, 10, 14, 17].includes(i) ? (
                <p className="nav-group">
                  {i === 1
                    ? "MATERIAIS E PRODUÇÃO"
                    : i === 10
                      ? "RELACIONAMENTO"
                      : i === 14
                        ? "FINANCEIRO"
                        : "SUA LOJA"}
                </p>
              ) : null}
              <Link
                onClick={() => setOpen(false)}
                href={"/painel" + (l.path ? "/" + l.path : "")}
                className={
                  path === "/painel" + (l.path ? "/" + l.path : "") ||
                  (l.path === "pedidos" && path.startsWith("/painel/pedidos/"))
                    ? "selected"
                    : ""
                }
              >
                <l.icon size={18} />
                {l.name}
                {l.path === "pedidos" && activeOrders(state).length ? (
                  <span className="nav-count">
                    {activeOrders(state).length}
                  </span>
                ) : null}
              </Link>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">BB</span>
          <div>
            <b>Seu espaço de criação</b>
            <small>
              {demo ? "Demonstração local" : "Conta administrativa"}
            </small>
          </div>
        </div>
      </aside>
      {open ? (
        <button
          className="overlay"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      ) : null}
      <div className="main-column">
        <header className="topbar">
          <button
            className="icon-btn mobile-only"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="global-search">
            <Search size={18} />
            <input
              aria-label="Busca global"
              placeholder="Buscar no seu ateliê…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search.length > 1 ? (
              <div className="search-results">
                {matches.length ? (
                  matches.map((m) => (
                    <Link
                      key={m.id}
                      onClick={() => setSearch("")}
                      href={
                        "/painel/" +
                        m.path +
                        "?busca=" +
                        encodeURIComponent(m.name)
                      }
                    >
                      {m.name}
                      <ChevronRight size={16} />
                    </Link>
                  ))
                ) : (
                  <p>Nenhum resultado.</p>
                )}
              </div>
            ) : null}
          </div>
          <div className="top-actions">
            <Link className="store-link" href="/loja" target="_blank">
              <Store size={16} />
              Ver minha loja
            </Link>
            <button
              className="icon-btn notification"
              aria-label="Notificações"
              onClick={() => setNotices(!notices)}
            >
              <Bell size={20} />
              {low.length ? <i /> : null}
            </button>
            <button
              className="icon-btn"
              aria-label="Sair"
              onClick={async () => {
                if (!demo) await browserClient().auth.signOut();
                router.push("/login");
              }}
            >
              <LogOut size={19} />
            </button>
            <span className="avatar">BB</span>
          </div>
          {notices ? (
            <div className="notification-panel">
              <h3>Atenção necessária</h3>
              {low.map((v) => (
                <p key={v.id}>
                  <b>{v.name}</b>
                  <small>
                    Estoque baixo: {v.stock} {v.unit}
                  </small>
                </p>
              ))}
              {activeOrders(state).map((o) => (
                <Link key={o.id} href={"/painel/pedidos/" + o.id}>
                  Pedido #{o.number} • {o.status}
                </Link>
              ))}
              {!low.length && !activeOrders(state).length ? (
                <p>Tudo em dia.</p>
              ) : null}
            </div>
          ) : null}
        </header>
        {demo ? (
          <div className="demo-banner">
            <span>
              Modo demonstração • dados fictícios salvos neste navegador.
            </span>
            <Link href="/painel/configuracoes">
              Configurar meu sistema <ChevronRight size={13} />
            </Link>
          </div>
        ) : null}
        <main className="main-content">
          {error ? (
            <div className="error" role="alert">
              {error === "FORBIDDEN" ? (
                "Este usuário não tem acesso ao painel. Configure o administrador no Supabase."
              ) : error === "UNAUTHENTICATED" ? (
                <Link href="/login">Entre novamente para continuar.</Link>
              ) : (
                error
              )}
            </div>
          ) : null}
          {loading ? (
            <div className="loading">Preparando seu ateliê…</div>
          ) : (
            children
          )}
        </main>
        <button
          className="fab"
          aria-label="Ações rápidas"
          onClick={() => setActions(!actions)}
        >
          <Plus />
        </button>
        {actions ? (
          <div className="quick-actions">
            {[
              ["Nova compra", "compras"],
              ["Novo pedido", "pedidos"],
              ["Nova produção", "producao"],
              ["Registrar perda", "perdas"],
              ["Novo material", "materiais"],
              ["Novo cliente", "clientes"],
            ].map(([label, url]) => (
              <Link
                key={url}
                onClick={() => setActions(false)}
                href={"/painel/" + url + "?novo=1&acao=" + Date.now()}
              >
                {label}
                <Plus size={16} />
              </Link>
            ))}
          </div>
        ) : null}
        {message ? (
          <div className="toast" role="status">
            {message}
          </div>
        ) : null}
        <nav className="mobile-bottom">
          {[links[0], links[10], links[8], links[9]].map((l) => (
            <Link key={l.path} href={"/painel/" + l.path}>
              <l.icon size={21} />
              <small>{l.name}</small>
            </Link>
          ))}
          <button onClick={() => setOpen(true)}>
            <Menu size={21} />
            <small>Menu</small>
          </button>
        </nav>
      </div>
    </div>
  );
}
