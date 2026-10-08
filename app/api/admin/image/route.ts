import { NextResponse } from "next/server";
import { requireAdmin, serviceClient } from "@/lib/supabase/server";
import { sameOrigin, apiError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireAdmin();
    const data = await request.formData();
    const file = data.get("file");
    if (
      !(file instanceof File) ||
      file.size > 4_000_000 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw new Error("Envie PNG, JPG ou WebP com até 4 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng =
      bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const isJpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const isWebp =
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!(
      (file.type === "image/png" && isPng) ||
      (file.type === "image/jpeg" && isJpeg) ||
      (file.type === "image/webp" && isWebp)
    ))
      throw new Error("Conteúdo da imagem inválido.");
    const client = serviceClient();
    const path =
      process.env.SHOP_ID +
      "/" +
      crypto.randomUUID() +
      "." +
      (isPng ? "png" : isJpeg ? "jpg" : "webp");
    const { error } = await client.storage
      .from("products")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (error)
      throw new Error(
        "Não foi possível enviar a imagem. Verifique o bucket products.",
      );
    return NextResponse.json({
      url: client.storage.from("products").getPublicUrl(path).data.publicUrl,
    });
  } catch (e) {
    return apiError(e);
  }
}
