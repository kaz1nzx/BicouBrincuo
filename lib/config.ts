export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
export function demoMode() {
  const publicValues = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ];
  return publicValues.every((v) => !v);
}
export function serverConfigured() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SHOP_ID: process.env.SHOP_ID,
    APP_ORIGIN: process.env.APP_ORIGIN,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);
  if (missing.length) {
    const location = process.env.VERCEL
      ? "Vercel → Settings → Environment Variables (Production). Depois faça um Redeploy."
      : ".env.local. Depois reinicie o servidor.";
    throw new Error(
      `Configuração incompleta. Preencha ${missing.join(", ")} em ${location}`,
    );
  }
}
