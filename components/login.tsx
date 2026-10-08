"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Scissors, LockKeyhole } from "lucide-react";
import { Brand, Badge } from "./ui";
import { browserClient } from "@/lib/supabase/client";
import { demoMode, configured } from "@/lib/config";
import { CraftScene } from "./craft-scene";
export function Login({
  reset,
  error: initialError,
}: {
  reset: boolean;
  error?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [mode, setMode] = useState(reset ? "reset" : "login"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(
      initialError === "access"
        ? "Entre com um usuário autorizado no SQL como administrador."
        : initialError
          ? "Não foi possível confirmar o link. Peça um novo link."
          : "",
    ),
    [message, setMessage] = useState("");
  const demo = demoMode();
  return (
    <main className="login-page">
      <section className="login-art">
        <Brand />
        <span className="eyebrow">CADERNO DO ATELIÊ / BICOU BRINCOU</span>
        <h1>
          Toda boa ideia
          <br />
          começa com
          <br />
          <em>uma bagunça.</em>
        </h1>
        <CraftScene compact />
        <div>
          <Scissors size={20} /> Aqui, cada peça encontra seu lugar.
        </div>
      </section>
      <section className="login-form">
        <Brand small />
        <Badge tone="wood">
          <LockKeyhole size={12} /> ACESSO AO ATELIÊ
        </Badge>
        <h2>
          {mode === "reset"
            ? "Uma nova senha"
            : mode === "recovery"
              ? "Recuperar acesso"
              : "Que bom ter você aqui."}
        </h2>
        <p>
          {demo
            ? "Explore o sistema com dados fictícios, sem configurar o banco."
            : "Entre para cuidar dos seus materiais, pedidos e produção."}
        </p>
        {error ? (
          <div className="error" role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="calculation" role="status">
            {message}
          </div>
        ) : null}
        {demo ? (
          <>
            <Link className="btn primary full" href="/painel">
              Entrar na demonstração <ArrowRight size={18} />
            </Link>
            <p className="muted">
              Sem senha. Os dados ficam apenas neste navegador.
            </p>
          </>
        ) : !configured() ? (
          <div className="error">
            Configuração incompleta. Confira .env.local.
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              setMessage("");
              try {
                const client = browserClient();
                if (mode === "recovery") {
                  const { error } = await client.auth.resetPasswordForEmail(
                    email,
                    {
                      redirectTo:
                        window.location.origin + "/auth/callback?recovery=1",
                    },
                  );
                  if (error) throw error;
                  setMessage(
                    "Se este e-mail estiver cadastrado, você receberá um link para recuperar o acesso.",
                  );
                } else if (mode === "reset") {
                  const { error } = await client.auth.updateUser({ password });
                  if (error) throw error;
                  await client.auth.signOut();
                  setMode("login");
                  setMessage("Senha atualizada. Entre com a nova senha.");
                } else {
                  const { error } = await client.auth.signInWithPassword({
                    email,
                    password,
                  });
                  if (error) throw new Error("E-mail ou senha inválidos.");
                  router.push("/painel");
                  router.refresh();
                }
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erro ao entrar.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {mode !== "reset" ? (
              <label>
                E-mail
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            ) : null}
            {mode !== "recovery" ? (
              <label>
                {mode === "reset"
                  ? "Nova senha (mínimo 8 caracteres)"
                  : "Senha"}
                <input
                  type="password"
                  autoComplete={
                    mode === "reset" ? "new-password" : "current-password"
                  }
                  minLength={mode === "reset" ? 8 : undefined}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            ) : null}
            <button className="btn primary full" type="submit" disabled={busy}>
              {busy
                ? "Aguarde…"
                : mode === "recovery"
                  ? "Enviar link"
                  : mode === "reset"
                    ? "Atualizar senha"
                    : "Entrar no meu ateliê"}
              <ArrowRight size={18} />
            </button>
            <button
              className="text-link"
              type="button"
              onClick={() => setMode(mode === "login" ? "recovery" : "login")}
            >
              {mode === "login" ? "Esqueci minha senha" : "Voltar para o login"}
            </button>
          </form>
        )}
        <Link className="text-link" href="/loja">
          Conhecer a loja virtual <ArrowRight size={15} />
        </Link>
      </section>
    </main>
  );
}
