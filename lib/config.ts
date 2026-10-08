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
  if (
    !configured() ||
    !process.env.SUPABASE_SECRET_KEY ||
    !process.env.SHOP_ID ||
    !process.env.APP_ORIGIN
  )
    throw new Error("Configuração incompleta. Confira .env.local e o README.");
}
