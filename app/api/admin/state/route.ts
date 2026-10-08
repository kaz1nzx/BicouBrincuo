import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { readState, transact } from "@/lib/repository";
import { execute } from "@/lib/engine";
import { sameOrigin, body, apiError } from "@/lib/http";
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await readState(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireAdmin();
    const command = await body(request);
    const result = await transact(
      (s) => ({
        state: execute(s, command, user.email || user.id),
        result: null,
      }),
      user.id,
    );
    return NextResponse.json(
      { state: result.state },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
