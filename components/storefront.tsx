"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  Bird,
  Heart,
  ShieldCheck,
  Package,
} from "lucide-react";
import {
  Brand,
  Badge,
  Modal,
  Fields,
  Empty,
  type Values,
  type Field,
} from "./ui";
import { demoMode } from "@/lib/config";
import { readDemo, DEMO_KEY } from "./provider";
import { CraftScene } from "./craft-scene";
import { money, checkout } from "@/lib/engine";
import type { Catalog, CatalogProduct } from "@/lib/types";
const CART_KEY = "bicou-brincou-cart-v1";
export function Storefront() {
  const demo = demoMode();
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [cart, setCart] = useState<{ id: string; quantity: number }[]>([]),
    [loaded, setLoaded] = useState(false),
    [product, setProduct] = useState<CatalogProduct | null>(null),
    [qty, setQty] = useState(1),
    [showCart, setShowCart] = useState(false),
    [checkoutStep, setCheckoutStep] = useState(false),
    [species, setSpecies] = useState("Todas"),
    [size, setSize] = useState("Todos"),
    [category, setCategory] = useState("Todas"),
    [maxPrice, setMaxPrice] = useState(""),
    [sort, setSort] = useState("Destaques"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState<{ number: number; total: number } | null>(
      null,
    ),
    [values, setValues] = useState<Values>({
      name: "",
      phone: "",
      email: "",
      document: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      payment: "Pix",
      website: "",
    });
  const requestId = useRef("");
  useEffect(() => {
    async function load() {
      try {
        const raw = localStorage.getItem(CART_KEY);
        if (raw) setCart(JSON.parse(raw));
        if (demo) {
          const s = readDemo();
          setCatalog({
            products: s.products.filter((p) => p.active && p.online),
            settings: s.settings,
          });
        } else {
          const response = await fetch("/api/catalog", { cache: "no-store" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setCatalog(data);
        }
        setLoaded(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar a loja.");
      }
    }
    void load();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      void navigator.serviceWorker.register("/sw.js");
  }, [demo]);
  useEffect(() => {
    if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, loaded]);
  function add(id: string, quantity: number) {
    setCart((items) => {
      const exists = items.find((i) => i.id === id);
      return exists
        ? items.map((i) =>
            i.id === id
              ? { ...i, quantity: Math.min(100000, i.quantity + quantity) }
              : i,
          )
        : [...items, { id, quantity }];
    });
    requestId.current = "";
    setProduct(null);
    setShowCart(true);
  }
  function change(id: string, quantity: number) {
    setCart((v) =>
      v.map((i) =>
        i.id === id
          ? { ...i, quantity: Math.max(1, Math.min(100000, quantity)) }
          : i,
      ),
    );
    requestId.current = "";
  }
  const products = catalog?.products || [];
  const items = cart.map((i) => ({
    ...i,
    product: products.find((p) => p.id === i.id),
  }));
  const valid = items.every((i) => i.product);
  const total =
    items.reduce((n, i) => n + (i.product?.price || 0) * i.quantity, 0) +
    (catalog?.settings.defaultFreight || 0);
  const filtered = products
    .filter(
      (p) =>
        (species === "Todas" || p.species === species) &&
        (size === "Todos" || p.size === size) &&
        (category === "Todas" || p.category === category) &&
        (!maxPrice || p.price <= Number(maxPrice)),
    )
    .sort((a, b) =>
      sort === "Menor preço"
        ? a.price - b.price
        : sort === "Maior preço"
          ? b.price - a.price
          : 0,
    );
  const fields: Field[] = [
    { key: "name", label: "Nome completo", required: true },
    { key: "phone", label: "Telefone / WhatsApp", required: true },
    { key: "email", label: "E-mail", type: "email", required: true },
    { key: "document", label: "CPF / CNPJ (opcional)" },
    { key: "address", label: "Endereço completo", required: true },
    { key: "city", label: "Cidade", required: true },
    { key: "state", label: "Estado (UF)", required: true },
    { key: "zip", label: "CEP", required: true },
    {
      key: "payment",
      label: "Pagamento a combinar",
      type: "select",
      required: true,
      options: [
        "Pix",
        "Dinheiro",
        "Cartão de crédito",
        "Cartão de débito",
        "Transferência",
        "Outro",
      ].map((v) => ({ value: v, label: v })),
    },
  ];
  async function send() {
    if (!valid || !cart.length) return;
    setBusy(true);
    setError("");
    try {
      requestId.current ||= crypto.randomUUID();
      const { payment, website, ...customer } = values;
      const input = {
        requestId: requestId.current,
        customer,
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
        payment,
        website,
      };
      let result: { number: number; total: number };
      if (demo) {
        const r = checkout(readDemo(), input);
        localStorage.setItem(DEMO_KEY, JSON.stringify(r.state));
        result = { number: r.order.number, total: r.order.total };
      } else {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        result = data;
      }
      setSuccess(result);
      setCart([]);
      setShowCart(false);
      setCheckoutStep(false);
      requestId.current = "";
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível enviar o pedido.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="storefront">
      <div className="atelier-ribbon">
        Pequenas peças. Muitas descobertas.{" "}
        <span>Brinquedos artesanais para aves</span>
      </div>
      <header className="store-header">
        <Link href="/loja">
          <Brand logo={catalog?.settings.logo} />
        </Link>
        <nav>
          <a href="#inicio">Início</a>
          <a href="#brinquedos">Brinquedos</a>
          <a href="#aves">Para sua ave</a>
          <a href="#sobre">Sobre nós</a>
        </nav>
        <button className="btn cart-button" onClick={() => setShowCart(true)}>
          <ShoppingBag size={20} />
          <span>Carrinho</span>
          <b>{cart.reduce((n, i) => n + i.quantity, 0)}</b>
        </button>
      </header>
      {demo ? (
        <div className="demo-banner">
          Loja de demonstração • nenhum pagamento é cobrado.
        </div>
      ) : null}
      {error && !showCart ? <div className="error">{error}</div> : null}
      <section className="store-hero" id="inicio">
        <div>
          <p className="eyebrow hero-eyebrow">
            <span /> DO NOSSO ATELIÊ PARA O SEU POLEIRO
          </p>
          <h1>
            Bico ocupado.
            <br />
            <em>Ave feliz.</em>
          </h1>
          <p>
            Um nó aqui, uma conta ali. Madeira que vira balanço, corda que vira
            aventura. Feito à mão para quem nasceu para explorar.
          </p>
          <a className="btn primary" href="#brinquedos">
            Encontrar o próximo brinquedo <ArrowRight size={18} />
          </a>
          <div className="hero-note">
            <Heart size={16} /> Do primeiro corte ao último nó, feito por nós.
          </div>
        </div>
        <CraftScene />
      </section>
      <section className="store-benefits" id="aves">
        {[
          [Heart, "Feito com carinho", "Produção artesanal, peça por peça."],
          [
            Bird,
            "Para explorar e brincar",
            "Enriquecimento para a rotina da sua ave.",
          ],
          [Package, "Do ateliê até você", "Pedidos preparados com atenção."],
        ].map(([Icon, title, text], i) => {
          const I = Icon as typeof Heart;
          return (
            <div key={i}>
              <span className="benefit-number">0{i + 1}</span>
              <I size={26} strokeWidth={1.4} />
              <strong>{String(title)}</strong>
              <p>{String(text)}</p>
            </div>
          );
        })}
      </section>
      <section className="catalog-section" id="brinquedos">
        <div className="section-header">
          <div>
            <p className="eyebrow">A COLEÇÃO DO ATELIÊ</p>
            <h2>Escolhidos a bico.</h2>
            <p>Escolha o próximo brinquedo favorito da sua ave.</p>
          </div>
        </div>
        <div className="store-filters">
          <select
            aria-label="Filtrar por ave"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          >
            <option>Todas</option>
            {[...new Set(products.map((p) => p.species))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="Filtrar por tamanho"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            <option>Todos</option>
            {[...new Set(products.map((p) => p.size))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="Filtrar por categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Todas</option>
            {[...new Set(products.map((p) => p.category))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <input
            aria-label="Preço máximo"
            type="number"
            min="0"
            placeholder="Preço máximo R$"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <select
            aria-label="Ordenar produtos"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {["Destaques", "Menor preço", "Maior preço"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        {!loaded && !error ? <p>Preparando nossa coleção…</p> : null}
        <div className="product-grid public-products">
          {filtered.map((p, index) => (
            <article className="product-card" key={p.id}>
              <button
                className="product-image"
                onClick={() => {
                  setProduct(p);
                  setQty(1);
                }}
              >
                <img src={p.image || "/images/balanco.svg"} alt={p.name} />
                <Badge tone="wood">
                  {p.stock ? "Pronta entrega" : "Sob encomenda"}
                </Badge>
              </button>
              <div className="product-body">
                <span className="collection-number">
                  PEÇA {String(index + 1).padStart(2, "0")}
                </span>
                <small>
                  {p.species} · tamanho {p.size}
                </small>
                <h3>
                  <button
                    onClick={() => {
                      setProduct(p);
                      setQty(1);
                    }}
                  >
                    {p.name}
                  </button>
                </h3>
                <div className="product-prices">
                  <strong>{money(p.price)}</strong>
                  <button
                    className="icon-btn add-cart"
                    aria-label={"Adicionar " + p.name}
                    onClick={() => add(p.id, 1)}
                  >
                    <Plus />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {loaded && !filtered.length ? (
          <Empty
            title="Novos brinquedos estão chegando"
            description="Não encontramos brinquedos com esses filtros."
          />
        ) : null}
      </section>
      <section className="about-section" id="sobre">
        <Bird size={46} strokeWidth={1.3} />
        <span className="eyebrow">BICOU BRINCOU BY PECK FUN</span>
        <h2>
          Um ateliê movido pelo
          <br />
          carinho pelas aves.
        </h2>
        <p>
          Criamos brinquedos artesanais para tornar a rotina das aves mais rica,
          curiosa e divertida. Cada peça é feita com cuidado, do primeiro corte
          ao último nó.
        </p>
        <small>
          Supervisione o uso, escolha o tamanho adequado e substitua brinquedos
          desgastados.
        </small>
      </section>
      <footer className="store-footer">
        <Brand small />
        <div>
          {catalog?.settings.email}
          <br />
          {catalog?.settings.address}
        </div>
        <p>Feito à mão, com carinho.</p>
        <Link href="/login">Acesso administrativo</Link>
      </footer>
      {product ? (
        <Modal title={product.name} onClose={() => setProduct(null)}>
          <div className="product-detail">
            <img
              src={product.image || "/images/balanco.svg"}
              alt={product.name}
            />
            <Badge tone="wood">
              {product.species} · {product.size}
            </Badge>
            <p>{product.description}</p>
            <strong className="big-price">{money(product.price)}</strong>
            <p>
              {product.stock > 0
                ? product.stock +
                  " unidades em estoque. Disponibilidade confirmada pela loja."
                : "Produzido sob encomenda. Prazo confirmado pela loja."}
            </p>
            <div className="quantity-control">
              <button
                aria-label="Diminuir quantidade"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus size={16} />
              </button>
              <input
                aria-label="Quantidade"
                type="number"
                min="1"
                max="100000"
                step="1"
                value={qty}
                onChange={(e) =>
                  setQty(
                    Math.max(1, Math.min(100000, Number(e.target.value) || 1)),
                  )
                }
              />
              <button
                aria-label="Aumentar quantidade"
                onClick={() => setQty(qty + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="btn primary"
              onClick={() => add(product.id, qty)}
            >
              Adicionar ao carrinho <ShoppingBag size={18} />
            </button>
          </div>
        </Modal>
      ) : null}
      {showCart ? (
        <Modal
          title={checkoutStep ? "Finalizar pedido" : "Seu carrinho"}
          onClose={() => {
            setShowCart(false);
            setCheckoutStep(false);
          }}
        >
          {error ? (
            <div className="error" role="alert">
              {error}
            </div>
          ) : null}
          {checkoutStep ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <Fields
                fields={fields}
                values={values}
                onChange={(v) => {
                  setValues(v);
                  requestId.current = "";
                }}
              />
              <input
                className="honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={String(values.website)}
                onChange={(e) =>
                  setValues({ ...values, website: e.target.value })
                }
              />
              <div className="calculation">
                <span>Total do pedido com frete fixo</span>
                <strong>{money(total)}</strong>
                <small>
                  O envio registra uma solicitação de pedido. Não cobra
                  pagamento. A loja confirmará prazo, disponibilidade e
                  pagamento.
                </small>
              </div>
              <div className="form-footer">
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => setCheckoutStep(false)}
                >
                  Voltar
                </button>
                <button className="btn primary" type="submit" disabled={busy}>
                  {busy ? "Enviando…" : "Enviar pedido"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {items.map((i) => (
                <div className="cart-row" key={i.id}>
                  <img src={i.product?.image || "/images/balanco.svg"} alt="" />
                  <div>
                    <strong>{i.product?.name || "Produto indisponível"}</strong>
                    <small>{money(i.product?.price || 0)}</small>
                    <div className="quantity-control">
                      <button
                        aria-label="Diminuir quantidade"
                        onClick={() => change(i.id, i.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{i.quantity}</span>
                      <button
                        aria-label="Aumentar quantidade"
                        onClick={() => change(i.id, i.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <button
                    className="icon-btn danger"
                    aria-label="Remover do carrinho"
                    onClick={() => {
                      setCart((c) => c.filter((v) => v.id !== i.id));
                      requestId.current = "";
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              {!cart.length ? (
                <Empty
                  title="Sua ave merece uma novidade"
                  description="Escolha um brinquedo para começar."
                />
              ) : (
                <>
                  <div className="totals">
                    <p>
                      Frete fixo{" "}
                      <b>{money(catalog?.settings.defaultFreight || 0)}</b>
                    </p>
                    <p className="total">
                      Total <b>{money(total)}</b>
                    </p>
                  </div>
                  {!valid ? (
                    <div className="error">
                      Remova os produtos indisponíveis para continuar.
                    </div>
                  ) : null}
                  <button
                    className="btn primary full"
                    disabled={!valid}
                    onClick={() => setCheckoutStep(true)}
                  >
                    Continuar pedido <ArrowRight size={17} />
                  </button>
                </>
              )}
            </>
          )}
        </Modal>
      ) : null}
      {success ? (
        <Modal title="Pedido recebido!" onClose={() => setSuccess(null)}>
          <div className="success-order">
            <ShieldCheck size={48} />
            <h2>Obrigada pelo carinho.</h2>
            <p>
              Seu pedido <b>#{success.number}</b> foi recebido.
              <br />
              Total: {money(success.total)}.
            </p>
            <p>
              A loja confirmará disponibilidade, prazo e pagamento. Nenhuma
              cobrança foi realizada.
            </p>
            {demo ? <Badge tone="wood">Pedido de demonstração</Badge> : null}
            {catalog?.settings.phone ? (
              <a
                className="btn primary"
                href={
                  "https://wa.me/" +
                  catalog.settings.phone.replace(/\D/g, "") +
                  "?text=" +
                  encodeURIComponent("Olá! Enviei o pedido #" + success.number)
                }
                target="_blank"
                rel="noreferrer"
              >
                Falar com a loja
              </a>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
