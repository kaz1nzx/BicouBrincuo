"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="panel">
      <h2>Não foi possível carregar esta tela.</h2>
      <p>Tente novamente. Seus dados já salvos são preservados.</p>
      <button className="btn primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
