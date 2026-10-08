import { NextResponse } from "next/server";
import { ZodError } from "zod";
export function sameOrigin(request: Request) {
  const expected = process.env.APP_ORIGIN;
  if (!expected || request.headers.get("origin") !== new URL(expected).origin)
    throw new Error("Origem não autorizada.");
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 8_000_000) throw new Error("Requisição muito grande.");
  return JSON.parse(text);
}
export function apiError(error: unknown) {
  const message =
    error instanceof ZodError
      ? error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")
      : error instanceof Error
        ? error.message
        : "Erro inesperado.";
  const status =
    message === "UNAUTHENTICATED"
      ? 401
      : message === "FORBIDDEN"
        ? 403
        : message.includes("Banco indisponível")
          ? 503
          : 400;
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
