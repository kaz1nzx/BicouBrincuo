import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Página não encontrada</h1>
      <p>Este caminho não faz parte do ateliê.</p>
      <Link className="btn primary" href="/painel">
        Voltar ao painel
      </Link>
    </main>
  );
}
