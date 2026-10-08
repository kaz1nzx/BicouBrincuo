import { redirect } from "next/navigation";
import Link from "next/link";
import { demoMode, configured, serverConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase/server";
import { Provider } from "@/components/provider";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (configured()) {
    // Configuration errors must not look like an expired login session.
    let configurationError = "";
    try {
      serverConfigured();
    } catch (error) {
      configurationError =
        error instanceof Error ? error.message : "Configuração incompleta.";
    }
    if (configurationError) {
      return (
        <main className="connection-state">
          <p className="eyebrow">BICOU BRINCOU / CONFIGURAÇÃO</p>
          <h1>Falta configurar a conexão.</h1>
          <p role="alert">{configurationError}</p>
          <p>
            O arquivo .env.local do computador não é enviado ao site na Vercel.
          </p>
          <Link className="btn" href="/login">
            Voltar ao login
          </Link>
        </main>
      );
    }
    try {
      await requireAdmin();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (reason === "UNAUTHENTICATED") redirect("/login");
      return (
        <main className="connection-state">
          <p className="eyebrow">BICOU BRINCOU / ACESSO AO PAINEL</p>
          <h1>
            {reason === "FORBIDDEN"
              ? "Acesso não autorizado."
              : "Não foi possível verificar o acesso."}
          </h1>
          <p role="alert">
            {reason === "FORBIDDEN"
              ? "Confira o SHOP_ID na hospedagem e se este usuário está autorizado na tabela shop_admins do mesmo projeto Supabase."
              : "Confira a conexão e as variáveis Supabase da hospedagem e tente novamente."}
          </p>
          <Link className="btn" href="/login">
            Voltar ao login
          </Link>
        </main>
      );
    }
  } else if (!demoMode())
    return (
      <main className="login-page">
        <h1>Configuração incompleta</h1>
        <p>
          Preencha as variáveis Supabase conforme o .env.example e reinicie o
          servidor.
        </p>
      </main>
    );
  return (
    <Provider>
      <Shell>{children}</Shell>
    </Provider>
  );
}
