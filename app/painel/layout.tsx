import { redirect } from "next/navigation";
import { demoMode, configured } from "@/lib/config";
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
    try {
      await requireAdmin();
    } catch {
      redirect("/login?error=access");
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
