import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url),
    code = url.searchParams.get("code");
  if (code) {
    const { error } = await (
      await serverClient()
    ).auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          url.searchParams.get("recovery") === "1"
            ? "/login?reset=1"
            : "/painel",
          url.origin,
        ),
      );
  }
  return NextResponse.redirect(new URL("/login?error=callback", url.origin));
}
