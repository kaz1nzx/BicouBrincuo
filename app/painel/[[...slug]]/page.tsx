import { notFound } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { EntityPage } from "@/components/entities";
import { OperationPage, OrderDetail } from "@/components/operations";
import {
  InventoryPage,
  PricingPage,
  RecipesPage,
  ReportsPage,
  SettingsPage,
  StoreAdmin,
} from "@/components/reports";
import type { Entity } from "@/lib/types";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug = [] } = await params;
  const query = await searchParams;
  const module = slug[0] || "";
  if (module === "pedidos" && slug.length === 2)
    return <OrderDetail id={slug[1]} />;
  if (slug.length > 1) notFound();
  const entities: Record<string, Entity> = {
    materiais: "materials",
    pecas: "parts",
    brinquedos: "products",
    clientes: "customers",
    fornecedores: "suppliers",
    custos: "expenses",
  };
  if (entities[module])
    return (
      <EntityPage
        key={module + ":" + (query.busca || "") + ":" + (query.acao || "")}
        entity={entities[module]}
        initialCreate={query.novo === "1"}
        initialSearch={query.busca || ""}
      />
    );
  if (
    ["compras", "transformacao", "perdas", "producao", "pedidos"].includes(
      module,
    )
  )
    return (
      <OperationPage
        key={module + ":" + (query.busca || "") + ":" + (query.acao || "")}
        module={
          module as
            "compras" | "transformacao" | "perdas" | "producao" | "pedidos"
        }
        initialCreate={query.novo === "1"}
      />
    );
  switch (module) {
    case "":
      return <Dashboard />;
    case "estoque":
      return <InventoryPage />;
    case "precificacao":
      return <PricingPage />;
    case "ficha-tecnica":
      return <RecipesPage />;
    case "relatorios":
      return <ReportsPage />;
    case "vendas":
      return <ReportsPage salesOnly />;
    case "configuracoes":
      return <SettingsPage />;
    case "loja-virtual":
      return <StoreAdmin />;
    default:
      notFound();
  }
}
