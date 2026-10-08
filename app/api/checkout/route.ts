import { NextResponse } from "next/server";
import { checkout } from "@/lib/engine";
import { transact } from "@/lib/repository";
import { serviceClient } from "@/lib/supabase/server";
import { body, sameOrigin, apiError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = await body(request);
    const { data, error } = await serviceClient().rpc("allow_checkout", {
      p_shop_id: process.env.SHOP_ID!,
      p_limit: Number(process.env.CHECKOUT_HOURLY_LIMIT || 100),
    });
    if (error || !data)
      return NextResponse.json(
        { error: "Limite temporário de pedidos. Tente novamente mais tarde." },
        { status: 429 },
      );
    const { result } = await transact((s) => {
      const r = checkout(s, input);
      return {
        state: r.state,
        result: { number: r.order.number, total: r.order.total },
      };
    }, "loja");
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
