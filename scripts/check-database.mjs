import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SHOP_ID",
  "APP_ORIGIN",
];
const missing = required.filter((name) => !process.env[name]?.trim());

async function check() {
  if (missing.length) {
    throw new Error(`Preencha no .env.local: ${missing.join(", ")}.`);
  }
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client
    .from("shop_state")
    .select("shop_id,revision")
    .eq("shop_id", process.env.SHOP_ID)
    .single();
  if (error) {
    throw new Error(`Falha na conexão com shop_state (${error.code || "sem código"}). Confira a chave secret, SHOP_ID e a instalação SQL.`);
  }
  const { count, error: adminError } = await client
    .from("shop_admins")
    .select("user_id", { count: "exact", head: true })
    .eq("shop_id", process.env.SHOP_ID);
  if (adminError) throw new Error("Não foi possível verificar os administradores da loja.");
  console.log(`Banco conectado. Revisão atual: ${data.revision}.`);
  if (!count) {
    throw new Error("Falta autorizar o usuário do painel: crie o usuário em Authentication > Users e execute supabase/grant-admin.sql com o UID dele.");
  }
  console.log("Administrador configurado. Reinicie o servidor e entre em /login.");
}

check().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
