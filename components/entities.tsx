"use client";
import { useState } from "react";
import { Pencil, Trash2, Search, ArrowUpRight } from "lucide-react";
import Link from "next/link";
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
import { money, number, productCost, today, dateLabel } from "@/lib/engine";
import type { Entity, Ingredient, Product } from "@/lib/types";
const names: Record<Entity, [string, string, string]> = {
  materials: [
    "Matérias-primas",
    "Os ingredientes para dar vida às suas ideias.",
    "Novo material",
  ],
  parts: ["Peças", "Madeira transformada, pronta para criar.", "Nova peça"],
  products: [
    "Brinquedos",
    "Sua coleção, custos e disponibilidade em um só lugar.",
    "Novo brinquedo",
  ],
  customers: [
    "Clientes",
    "Quem confia no carinho do seu trabalho.",
    "Novo cliente",
  ],
  suppliers: [
    "Fornecedores",
    "Os parceiros que fazem parte do seu ateliê.",
    "Novo fornecedor",
  ],
  expenses: [
    "Custos",
    "Despesas do ateliê, sem perder nenhum detalhe.",
    "Nova despesa",
  ],
};
export function RecipeEditor({
  recipe,
  onChange,
}: {
  recipe: Ingredient[];
  onChange: (r: Ingredient[]) => void;
}) {
  const { state } = useStore();
  return (
    <div className="recipe-editor">
      <div className="card-title">
        <h3>Ficha técnica</h3>
        <button
          className="btn small"
          type="button"
          onClick={() =>
            onChange([
              ...recipe,
              {
                kind: state.parts.length ? "part" : "material",
                itemId: state.parts[0]?.id || state.materials[0]?.id || "",
                quantity: 1,
              },
            ])
          }
        >
          + Componente
        </button>
      </div>
      <p className="muted">
        Cadastre a embalagem aqui ou em custos adicionais, uma única vez.
      </p>
      {recipe.map((r, i) => (
        <div className="recipe-row" key={i}>
          <select
            aria-label="Tipo de componente"
            value={r.kind}
            onChange={(e) =>
              onChange(
                recipe.map((v, j) =>
                  i === j
                    ? {
                        ...v,
                        kind: e.target.value as Ingredient["kind"],
                        itemId: "",
                      }
                    : v,
                ),
              )
            }
          >
            <option value="part">Peça</option>
            <option value="material">Material</option>
          </select>
          <select
            aria-label="Componente"
            required
            value={r.itemId}
            onChange={(e) =>
              onChange(
                recipe.map((v, j) =>
                  i === j ? { ...v, itemId: e.target.value } : v,
                ),
              )
            }
          >
            <option value="">Selecione</option>
            {(r.kind === "part" ? state.parts : state.materials).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.unit})
              </option>
            ))}
          </select>
          <input
            aria-label="Quantidade do componente"
            type="number"
            min="0.001"
            step="any"
            required
            value={r.quantity}
            onChange={(e) =>
              onChange(
                recipe.map((v, j) =>
                  i === j ? { ...v, quantity: Number(e.target.value) } : v,
                ),
              )
            }
          />
          <button
            aria-label="Remover componente"
            type="button"
            className="icon-btn danger"
            onClick={() => onChange(recipe.filter((_, j) => j !== i))}
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
    </div>
  );
}
export function EntityPage({
  entity,
  initialCreate = false,
  initialSearch = "",
}: {
  entity: Entity;
  initialCreate?: boolean;
  initialSearch?: string;
}) {
  const { state, run, busy, demo } = useStore();
  const [search, setSearch] = useState(initialSearch),
    [editing, setEditing] = useState<Values | null>(
      initialCreate ? defaults(entity) : null,
    ),
    [recipe, setRecipe] = useState<Ingredient[]>([]),
    [deleting, setDeleting] = useState<string | null>(null),
    [history, setHistory] = useState<string | null>(null),
    [formError, setFormError] = useState("");
  function defaults(e: Entity): Values {
    const base = {
      id: "",
      name: "",
      sku: "",
      category: "",
      notes: "",
      stock: 0,
      minimum: 0,
      unit: "un",
      cost: 0,
    };
    return e === "materials"
      ? { ...base, unit: "cm", supplierId: "", lastPrice: 0, lastPurchase: "" }
      : e === "parts"
        ? {
            ...base,
            materialId: "",
            length: 5,
            width: 0,
            height: 0,
            diameter: 0,
          }
        : e === "products"
          ? {
              ...base,
              description: "",
              species: "Calopsitas",
              size: "M",
              image: "",
              price: 0,
              active: true,
              online: true,
              labor: 0,
              overhead: 0,
              extra: 0,
            }
          : e === "expenses"
            ? {
                id: "",
                name: "",
                category: "Custos fixos",
                amount: 0,
                date: today(),
                notes: "",
              }
            : {
                id: "",
                name: "",
                phone: "",
                email: "",
                document: "",
                address: "",
                city: "",
                state: "",
                zip: "",
                notes: "",
                company: "",
              };
  }
  const contact = entity === "customers" || entity === "suppliers",
    inventory = !contact && entity !== "expenses";
  const fields: Field[] = [
    { key: "name", label: "Nome", required: true },
    ...(inventory
      ? [
          { key: "sku", label: "Código / SKU", required: true },
          { key: "category", label: "Categoria" },
          {
            key: "unit",
            label: "Unidade",
            type: "select" as const,
            required: true,
            disabled: entity !== "materials" || Boolean(editing?.id),
            options: [
              "un",
              "m",
              "cm",
              "mm",
              "kg",
              "g",
              "L",
              "mL",
              "barra",
              "pacote",
              "chapa",
            ].map((v) => ({ value: v, label: v })),
          },
          {
            key: "stock",
            label: "Estoque inicial",
            type: "number" as const,
            disabled: Boolean(editing?.id),
            hint: editing?.id
              ? "Altere o saldo por compras, produção ou perdas."
              : undefined,
          },
          { key: "minimum", label: "Estoque mínimo", type: "number" as const },
          {
            key: "cost",
            label: "Custo unitário inicial (R$)",
            type: "number" as const,
            disabled: Boolean(editing?.id),
          },
        ]
      : []),
    ...(entity === "materials"
      ? [
          {
            key: "supplierId",
            label: "Fornecedor principal",
            type: "select" as const,
            options: state.suppliers.map((v) => ({
              value: v.id,
              label: v.name,
            })),
          },
        ]
      : []),
    ...(entity === "parts"
      ? [
          {
            key: "materialId",
            label: "Madeira de origem (em cm)",
            type: "select" as const,
            required: true,
            options: state.materials
              .filter((v) => v.unit === "cm")
              .map((v) => ({ value: v.id, label: v.name })),
          },
          ...["length", "width", "height", "diameter"].map((key, i) => ({
            key,
            label: [
              "Comprimento (cm)",
              "Largura (cm)",
              "Altura (cm)",
              "Diâmetro (cm)",
            ][i],
            type: "number" as const,
            required: i === 0,
            min: i === 0 ? 0.001 : 0,
          })),
        ]
      : []),
    ...(entity === "products"
      ? [
          {
            key: "price",
            label: "Preço de venda (R$)",
            type: "number" as const,
            required: true,
          },
          {
            key: "species",
            label: "Ave indicada",
            type: "select" as const,
            options: [
              "Calopsitas",
              "Periquitos",
              "Agapornis",
              "Papagaios",
              "Araras",
              "Ring Necks",
              "Pequenas aves",
              "Médias aves",
              "Grandes aves",
            ].map((v) => ({ value: v, label: v })),
          },
          { key: "size", label: "Tamanho" },
          { key: "image", label: "URL da foto" },
          {
            key: "labor",
            label: "Mão de obra por unidade (R$)",
            type: "number" as const,
          },
          {
            key: "overhead",
            label: "Custo fixo proporcional (R$)",
            type: "number" as const,
          },
          {
            key: "extra",
            label: "Adicionais por unidade (R$)",
            type: "number" as const,
          },
          {
            key: "active",
            label: "Brinquedo ativo",
            type: "checkbox" as const,
          },
          {
            key: "online",
            label: "Exibir na loja virtual",
            type: "checkbox" as const,
          },
          { key: "description", label: "Descrição", type: "textarea" as const },
        ]
      : []),
    ...(contact
      ? [
          { key: "phone", label: "Telefone / WhatsApp" },
          { key: "email", label: "E-mail", type: "email" as const },
          { key: "document", label: "CPF / CNPJ (opcional)" },
          { key: "company", label: "Empresa" },
          { key: "address", label: "Endereço" },
          { key: "city", label: "Cidade" },
          { key: "state", label: "Estado (UF)" },
          { key: "zip", label: "CEP" },
        ]
      : []),
    ...(entity === "expenses"
      ? [
          { key: "category", label: "Categoria" },
          {
            key: "amount",
            label: "Valor (R$)",
            type: "number" as const,
            required: true,
            min: 0.01,
          },
          { key: "date", label: "Data", type: "date" as const, required: true },
        ]
      : []),
    { key: "notes", label: "Observações", type: "textarea" },
  ];
  const rows = (state[entity] as unknown as Record<string, unknown>[]).filter(
    (v) =>
      [v.name, v.sku, v.category, v.phone].some((x) =>
        String(x || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
  );
  function open(row?: Record<string, unknown>) {
    setEditing(
      row
        ? (Object.fromEntries(
            Object.entries(row).filter(([, v]) => typeof v !== "object"),
          ) as Values)
        : defaults(entity),
    );
    setRecipe((row?.recipe as Ingredient[]) || []);
    setFormError("");
  }
  async function save() {
    if (!editing) return;
    try {
      await run(
        entity === "customers" || entity === "suppliers"
          ? { type: "saveContact", entity, data: editing }
          : {
              type:
                entity === "materials"
                  ? "saveMaterial"
                  : entity === "parts"
                    ? "savePart"
                    : entity === "products"
                      ? "saveProduct"
                      : "saveExpense",
              data: entity === "products" ? { ...editing, recipe } : editing,
            },
      );
      setEditing(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  }
  return (
    <>
      <SectionHeader
        title={names[entity][0]}
        description={names[entity][1]}
        action={() => open()}
        actionLabel={names[entity][2]}
      />
      <div className="toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Buscar cadastros"
            placeholder="Buscar por nome ou código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="muted">
          {rows.length} {rows.length === 1 ? "cadastro" : "cadastros"}
        </span>
      </div>
      {!rows.length ? (
        <Empty />
      ) : entity === "products" ? (
        <div className="product-grid">
          {rows.map((r) => {
            const p = r as unknown as Product;
            const cost = productCost(state, p);
            return (
              <article className="product-card" key={p.id}>
                <div className="product-image">
                  <img src={p.image || "/images/balanco.svg"} alt={p.name} />
                  <Badge tone={p.active ? "wood" : "neutral"}>
                    {p.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="product-body">
                  <small>
                    {p.sku} · {p.species}
                  </small>
                  <h3>{p.name}</h3>
                  <div className="product-prices">
                    <strong>{money(p.price)}</strong>
                    <span>{p.stock} em estoque</span>
                  </div>
                  <div className="product-cost">
                    <span>Custo da ficha</span>
                    <b>{money(cost)}</b>
                  </div>
                  <div className="product-cost">
                    <span>Margem teórica</span>
                    <b>{p.price ? number((1 - cost / p.price) * 100) : "0"}%</b>
                  </div>
                  <footer>
                    <button className="btn small" onClick={() => open(r)}>
                      <Pencil size={15} />
                      Editar / ficha
                    </button>
                    <button
                      className="icon-btn danger"
                      aria-label={"Excluir " + p.name}
                      onClick={() => setDeleting(p.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel data-list">
          <div className="list-head">
            <span>
              {contact ? "Nome" : entity === "expenses" ? "Despesa" : "Item"}
            </span>
            <span>{inventory ? "Estoque" : contact ? "Contato" : "Data"}</span>
            <span>
              {inventory ? "Custo unitário" : contact ? "Cidade" : "Valor"}
            </span>
            <span>Ações</span>
          </div>
          {rows.map((r) => (
            <div className="list-row" key={String(r.id)}>
              <div>
                <strong>{String(r.name)}</strong>
                <small>
                  {String(r.sku || r.category || r.company || r.email || "")}
                </small>
              </div>
              <div>
                {inventory ? (
                  <>
                    <strong>
                      {number(Number(r.stock))}{" "}
                      <small className="inline">{String(r.unit)}</small>
                    </strong>
                    <Badge
                      tone={
                        Number(r.stock) <= Number(r.minimum) ? "coral" : "sage"
                      }
                    >
                      {Number(r.stock) <= Number(r.minimum)
                        ? "Estoque baixo"
                        : "Em dia"}
                    </Badge>
                  </>
                ) : contact ? (
                  <span>{String(r.phone) || "Sem telefone"}</span>
                ) : (
                  dateLabel(String(r.date))
                )}
              </div>
              <div>
                <strong>
                  {inventory
                    ? money(Number(r.cost))
                    : contact
                      ? String(r.city) || "—"
                      : money(Number(r.amount))}
                </strong>
              </div>
              <div className="row-actions">
                {contact ? (
                  <button
                    className="icon-btn"
                    onClick={() => setHistory(String(r.id))}
                    aria-label="Ver histórico"
                  >
                    <ArrowUpRight size={17} />
                  </button>
                ) : null}
                <button
                  className="icon-btn"
                  onClick={() => open(r)}
                  aria-label={"Editar " + r.name}
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => setDeleting(String(r.id))}
                  aria-label={"Excluir " + r.name}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing ? (
        <Modal
          title={editing.id ? "Editar cadastro" : names[entity][2]}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={submit(save)}>
            {formError ? (
              <div className="error" role="alert">
                {formError}
              </div>
            ) : null}
            <Fields fields={fields} values={editing} onChange={setEditing} />
            {entity === "products" ? (
              <>
                <label className="upload-label">
                  Enviar foto do brinquedo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        if (file.size > 4_000_000)
                          throw new Error("Foto deve ter até 4 MB.");
                        if (demo) {
                          const reader = new FileReader();
                          reader.onload = () =>
                            setEditing((v) =>
                              v ? { ...v, image: String(reader.result) } : v,
                            );
                          reader.readAsDataURL(file);
                        } else {
                          const data = new FormData();
                          data.append("file", file);
                          const response = await fetch("/api/admin/image", {
                            method: "POST",
                            body: data,
                          });
                          const json = await response.json();
                          if (!response.ok) throw new Error(json.error);
                          setEditing((v) =>
                            v ? { ...v, image: json.url } : v,
                          );
                        }
                      } catch (err) {
                        setFormError(
                          err instanceof Error ? err.message : "Erro no envio.",
                        );
                      }
                    }}
                  />
                </label>
                <RecipeEditor recipe={recipe} onChange={setRecipe} />
              </>
            ) : null}
            <FormFooter busy={busy} onClose={() => setEditing(null)} />
          </form>
        </Modal>
      ) : null}
      {deleting ? (
        <Modal title="Excluir cadastro?" onClose={() => setDeleting(null)}>
          <p>
            Cadastros com movimentações ou vínculos são preservados para manter
            o histórico.
          </p>
          <div className="form-footer">
            <button className="btn" onClick={() => setDeleting(null)}>
              Voltar
            </button>
            <button
              className="btn danger-btn"
              disabled={busy}
              onClick={async () => {
                try {
                  await run({ type: "delete", entity, id: deleting });
                  setDeleting(null);
                } catch {
                  /* provider */
                }
              }}
            >
              Excluir
            </button>
          </div>
        </Modal>
      ) : null}
      {history ? (
        <Modal title="Histórico" onClose={() => setHistory(null)}>
          {entity === "customers"
            ? state.orders
                .filter((o) => o.customerId === history)
                .map((o) => (
                  <Link
                    className="history-link"
                    key={o.id}
                    href={"/painel/pedidos/" + o.id}
                  >
                    Pedido #{o.number}
                    <b>{money(o.total)}</b>
                  </Link>
                ))
            : state.purchases
                .filter((p) => p.supplierId === history)
                .map((p) => (
                  <div className="history-link" key={p.id}>
                    {dateLabel(p.date)}
                    <b>{money(p.total + p.freight + p.extra)}</b>
                  </div>
                ))}
        </Modal>
      ) : null}
    </>
  );
}
