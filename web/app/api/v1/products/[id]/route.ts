import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { checkApiKey } from "@/lib/apiAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parsePriceToCents } from "@/lib/price";
import { PhotoInputError } from "@/lib/apiPhotos";
import { fetchApiProduct, resolveCategory, resolvePhotoInputs, type PhotoItemInput } from "@/lib/apiProducts";
import type { TablesUpdate } from "@/lib/database.types";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  const product = await fetchApiProduct(id);
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ product });
}

type PatchBody = {
  category?: string;
  name?: string;
  description?: string;
  note?: string | null;
  kitLabel?: string | null;
  pricingMode?: "single" | "lines";
  price?: string;
  priceLines?: { label: string; price: string }[];
  isActive?: boolean;
  photos?: PhotoItemInput[]; // full replace
  addPhotos?: PhotoItemInput[]; // append to existing
  removePhotoPaths?: string[]; // remove from existing
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido no corpo da requisição." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("products")
    .select(`*, product_photos (*)`)
    .eq("id", id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const productUpdate: TablesUpdate<"products"> = {};

  if (body.category !== undefined) {
    const category = await resolveCategory(body.category);
    if (!category) {
      return NextResponse.json({ error: `Categoria '${body.category}' não encontrada.` }, { status: 404 });
    }
    productUpdate.category_id = category.id;
  }
  if (body.name !== undefined) productUpdate.name = body.name;
  if (body.description !== undefined) productUpdate.description = body.description;
  if (body.note !== undefined) productUpdate.note = body.note || null;
  if (body.kitLabel !== undefined) productUpdate.kit_label = body.kitLabel || null;
  if (body.isActive !== undefined) productUpdate.is_active = body.isActive;

  const pricingChanged = body.pricingMode !== undefined || body.price !== undefined || body.priceLines !== undefined;
  const pricingMode = body.pricingMode ?? (existing.pricing_mode as "single" | "lines");

  if (pricingChanged) {
    if (pricingMode === "single") {
      const priceCents = body.price ? parsePriceToCents(body.price) : existing.price_cents;
      if (priceCents === null) {
        return NextResponse.json({ error: "'price' inválido para pricingMode 'single'." }, { status: 400 });
      }
      productUpdate.pricing_mode = "single";
      productUpdate.price_cents = priceCents;
    } else {
      if (!body.priceLines || body.priceLines.length === 0) {
        return NextResponse.json({ error: "'priceLines' é obrigatório para pricingMode 'lines'." }, { status: 400 });
      }
      productUpdate.pricing_mode = "lines";
      productUpdate.price_cents = null;
    }
  }

  if (Object.keys(productUpdate).length > 0) {
    const { error } = await supabase.from("products").update(productUpdate).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (pricingChanged) {
    const { error: deleteError } = await supabase.from("product_prices").delete().eq("product_id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    if (pricingMode === "lines" && body.priceLines) {
      const rows = body.priceLines.map((line, i) => ({
        product_id: id,
        label: line.label,
        price_cents: parsePriceToCents(line.price) ?? 0,
        position: i,
      }));
      const { error: linesError } = await supabase.from("product_prices").insert(rows);
      if (linesError) return NextResponse.json({ error: linesError.message }, { status: 500 });
    }
  }

  const photosTouched = body.photos !== undefined || body.addPhotos !== undefined || body.removePhotoPaths !== undefined;
  if (photosTouched) {
    const currentPhotos = (existing.product_photos as { path: string; alt: string | null; position: number }[]).sort(
      (a, b) => a.position - b.position
    );

    let nextPhotos: { path: string; alt: string }[];
    try {
      if (body.photos !== undefined) {
        nextPhotos = await resolvePhotoInputs(body.photos);
      } else {
        const toRemove = new Set(body.removePhotoPaths ?? []);
        const kept = currentPhotos.filter((p) => !toRemove.has(p.path)).map((p) => ({ path: p.path, alt: p.alt ?? "" }));
        const added = await resolvePhotoInputs(body.addPhotos ?? []);
        nextPhotos = [...kept, ...added];
      }
    } catch (e) {
      const status = e instanceof PhotoInputError ? 400 : 500;
      return NextResponse.json({ error: e instanceof Error ? e.message : "Falha ao processar fotos." }, { status });
    }

    const { error: deletePhotosError } = await supabase.from("product_photos").delete().eq("product_id", id);
    if (deletePhotosError) return NextResponse.json({ error: deletePhotosError.message }, { status: 500 });

    if (nextPhotos.length > 0) {
      const rows = nextPhotos.map((p, i) => ({
        product_id: id,
        path: p.path,
        alt: p.alt || (body.name ?? existing.name),
        position: i,
      }));
      const { error: photosError } = await supabase.from("product_photos").insert(rows);
      if (photosError) return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    const newPaths = new Set(nextPhotos.map((p) => p.path));
    const removedPaths = currentPhotos.map((p) => p.path).filter((p) => !newPaths.has(p));
    if (removedPaths.length > 0) {
      await supabase.storage.from("product-photos").remove(removedPaths);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/products");

  const result = await fetchApiProduct(id);
  return NextResponse.json({ product: result });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: photos } = await supabase.from("product_photos").select("path").eq("product_id", id);

  const { error, count } = await supabase.from("products").delete({ count: "exact" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  if (photos && photos.length > 0) {
    await supabase.storage.from("product-photos").remove(photos.map((p) => p.path));
  }

  revalidatePath("/");
  revalidatePath("/admin/products");

  return NextResponse.json({ ok: true });
}
