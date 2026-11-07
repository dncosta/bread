import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { checkApiKey } from "@/lib/apiAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parsePriceToCents } from "@/lib/price";
import { PhotoInputError } from "@/lib/apiPhotos";
import {
  fetchApiProduct,
  listApiProducts,
  resolveCategory,
  resolvePhotoInputs,
  type PhotoItemInput,
} from "@/lib/apiProducts";

export async function GET(request: NextRequest) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const products = await listApiProducts({
    categorySlug: searchParams.get("category") ?? undefined,
    status: status === "active" || status === "paused" ? status : "all",
    search: searchParams.get("search") ?? undefined,
  });

  return NextResponse.json({ products });
}

type CreateBody = {
  category?: string;
  name?: string;
  description?: string;
  note?: string;
  kitLabel?: string;
  pricingMode?: "single" | "lines";
  price?: string;
  priceLines?: { label: string; price: string }[];
  photos?: PhotoItemInput[];
  isActive?: boolean;
};

export async function POST(request: NextRequest) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido no corpo da requisição." }, { status: 400 });
  }

  if (!body.category) return NextResponse.json({ error: "'category' é obrigatório." }, { status: 400 });
  if (!body.name) return NextResponse.json({ error: "'name' é obrigatório." }, { status: 400 });

  const category = await resolveCategory(body.category);
  if (!category) {
    return NextResponse.json({ error: `Categoria '${body.category}' não encontrada.` }, { status: 404 });
  }

  const pricingMode = body.pricingMode ?? (body.priceLines?.length ? "lines" : "single");
  const priceCents = pricingMode === "single" && body.price ? parsePriceToCents(body.price) : null;
  if (pricingMode === "single" && (!body.price || priceCents === null)) {
    return NextResponse.json({ error: "'price' inválido ou ausente para pricingMode 'single'." }, { status: 400 });
  }
  if (pricingMode === "lines" && (!body.priceLines || body.priceLines.length === 0)) {
    return NextResponse.json({ error: "'priceLines' é obrigatório para pricingMode 'lines'." }, { status: 400 });
  }

  let photos: { path: string; alt: string }[];
  try {
    photos = await resolvePhotoInputs(body.photos ?? []);
  } catch (e) {
    const status = e instanceof PhotoInputError ? 400 : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Falha ao processar fotos." }, { status });
  }

  const supabase = createServiceRoleClient();

  const { data: maxPos } = await supabase
    .from("products")
    .select("position")
    .eq("category_id", category.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      category_id: category.id,
      name: body.name,
      description: body.description ?? "",
      note: body.note || null,
      kit_label: body.kitLabel || null,
      pricing_mode: pricingMode,
      price_cents: priceCents,
      is_active: body.isActive ?? true,
      position: (maxPos?.position ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error || !product) {
    return NextResponse.json({ error: error?.message ?? "Falha ao criar produto." }, { status: 500 });
  }

  if (pricingMode === "lines" && body.priceLines) {
    const rows = body.priceLines.map((line, i) => ({
      product_id: product.id,
      label: line.label,
      price_cents: parsePriceToCents(line.price) ?? 0,
      position: i,
    }));
    const { error: linesError } = await supabase.from("product_prices").insert(rows);
    if (linesError) return NextResponse.json({ error: linesError.message }, { status: 500 });
  }

  if (photos.length > 0) {
    const rows = photos.map((p, i) => ({
      product_id: product.id,
      path: p.path,
      alt: p.alt || body.name!,
      position: i,
    }));
    const { error: photosError } = await supabase.from("product_photos").insert(rows);
    if (photosError) return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/admin/products");

  const result = await fetchApiProduct(product.id);
  return NextResponse.json({ product: result }, { status: 201 });
}
