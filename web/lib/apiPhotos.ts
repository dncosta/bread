import sharp from "sharp";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Gemini's function-calling payload travels as JSON over an HTTP body —
// Vercel caps that at well under what a raw phone photo's base64 would
// need, so we fail fast with a clear message rather than a generic 413.
const MAX_BASE64_CHARS = 6_000_000; // ~4.5MB decoded, leaves headroom in the request

export class PhotoInputError extends Error {}

function decodeBase64Image(input: string): Buffer {
  const match = input.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([\s\S]+)$/);
  const data = match ? match[1] : input;
  if (data.length > MAX_BASE64_CHARS) {
    throw new PhotoInputError(
      "Foto grande demais. Peça para reenviar em resolução menor ou mais comprimida."
    );
  }
  try {
    return Buffer.from(data, "base64");
  } catch {
    throw new PhotoInputError("Não foi possível decodificar a foto (base64 inválido).");
  }
}

/**
 * Resizes/encodes a base64-encoded photo server-side (mirrors what
 * PhotoUploader.tsx does in the browser with canvas, since this call comes
 * from an external API client with no browser involved) and uploads it to
 * the product-photos bucket. Returns the Storage path for a product_photos
 * row.
 */
export async function uploadPhotoFromBase64(base64: string, maxDim = 1000, quality = 82): Promise<string> {
  const buffer = decodeBase64Image(base64);

  let resized: Buffer;
  try {
    resized = await sharp(buffer)
      .rotate() // respect EXIF orientation before stripping it
      .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  } catch {
    throw new PhotoInputError("Arquivo não parece ser uma imagem válida.");
  }

  const path = `products/${crypto.randomUUID()}.webp`;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage
    .from("product-photos")
    .upload(path, resized, { contentType: "image/webp" });

  if (error) throw new Error(`Falha ao enviar foto: ${error.message}`);
  return path;
}
