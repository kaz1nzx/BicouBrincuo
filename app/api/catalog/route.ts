import { NextResponse } from "next/server";
import { readState } from "@/lib/repository";
import { demoMode } from "@/lib/config";
import { demoState } from "@/lib/seed";
import { apiError } from "@/lib/http";
export async function GET() {
  try {
    const s = demoMode() ? demoState() : (await readState()).state;
    return NextResponse.json(
      {
        products: s.products
          .filter((p) => p.active && p.online)
          .map(
            ({
              id,
              name,
              description,
              species,
              size,
              image,
              price,
              stock,
              category,
            }) => ({
              id,
              name,
              description,
              species,
              size,
              image,
              price,
              stock,
              category,
            }),
          ),
        settings: {
          name: s.settings.name,
          subtitle: s.settings.subtitle,
          phone: s.settings.phone,
          email: s.settings.email,
          address: s.settings.address,
          logo: s.settings.logo,
          defaultFreight: s.settings.defaultFreight,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
