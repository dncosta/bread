import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { serializeProduct, type ApiProduct } from "@/lib/apiSerialize";
import { uploadPhotoFromBase64, PhotoInputError } from "@/lib/apiPhotos";
import { parsePriceToCents } from "@/lib/price";
import type { Category, Product, ProductPhoto, ProductPrice } from "@/lib/types";
import type { TablesUpdate } from "@/lib/database.types";

type ProductRow = Product & {
  categories: Category;
  product_prices: ProductPrice[];
  product_photos: ProductPhoto[];
};

const PRODUCT_SELECT = `*, categories (*), product_prices (*), product_photos (*)`;

export async function fetchApiProduct(id: string): Promise<ApiProduct | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const row = data as unknown as ProductRow;
  return serializeProduct(row, row.categories, row.product_prices, row.product_photos);
}

export async function listApiProducts(filters: {
  categorySlug?: string;
  status?: "active" | "paused" | "all";
  search?: string;
}): Promise<ApiProduct[]> {
  const supabase = createServiceRoleClient();
  let query = supabase.from("products").select(PRODUCT_SELECT).order("name");

  if (filters.status === "active") query = query.eq("is_active", true);
  if (filters.status === "paused") query = query.eq("is_active", false);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []) as unknown as ProductRow[];
  if (filters.categorySlug) {
    rows = rows.filter((r) => r.categories.slug === filters.categorySlug);
  }
  return rows.map((r) => serializeProduct(r, r.categories, r.product_prices, r.product_photos));
}

/** Resolves a category by slug first (the natural identifier for conversational use), then by id. */
export async function resolveCategory(identifier: string): Promise<Category | null> {
  const supabase = createServiceRoleClient();
  const { data: bySlug } = await supabase.from("categories").select("*").eq("slug", identifier).maybeSingle();
  if (bySlug) return bySlug;
  const { data: byId } = await supabase.from("categories").select("*").eq("id", identifier).maybeSingle();
  return byId ?? null;
}

export type PhotoItemInput = { base64?: string; path?: string; alt?: string };

/** Resolves a mixed list of "keep this existing path" / "upload this new base64" photo inputs. */
export async function resolvePhotoInputs(
  items: PhotoItemInput[]
): Promise<{ path: string; alt: string }[]> {
  const out: { path: string; alt: string }[] = [];
  for (const item of items) {
    if (item.path) {
      out.push({ path: item.path, alt: item.alt ?? "" });
    } else if (item.base64) {
      const path = await uploadPhotoFromBase64(item.base64);
      out.push({ path, alt: item.alt ?? "" });
    } else {
      throw new Error("Cada foto precisa de 'base64' (nova) ou 'path' (de uma foto já existente).");
    }
  }
  return out;
}

// --- Shared create/update/delete logic, used by both the REST routes
// (app/api/v1/products) and the MCP tools (app/api/mcp) so the two
// surfaces can never drift apart on validation or side effects. ---

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

export type CreateProductInput = {
  category: string;
  name: string;
  description?: string;
  note?: string;
  kitLabel?: string;
  pricingMode?: "single" | "lines";
  price?: string;
  priceLines?: { label: string; price: string }[];
  photos?: PhotoItemInput[];
  isActive?: boolean;
};

export async function createApiProduct(input: CreateProductInput): Promise<ApiResult<ApiProduct>> {
  if (!input.category) return { ok: false, error: "'category' é obrigatório.", status: 400 };
  if (!input.name) return { ok: false, error: "'name' é obrigatório.", status: 400 };

  const category = await resolveCategory(input.category);
  if (!category) return { ok: false, error: `Categoria '${input.category}' não encontrada.`, status: 404 };

  const pricingMode = input.pricingMode ?? (input.priceLines?.length ? "lines" : "single");
  const priceCents = pricingMode === "single" && input.price ? parsePriceToCents(input.price) : null;
  if (pricingMode === "single" && (!input.price || priceCents === null)) {
    return { ok: false, error: "'price' inválido ou ausente para pricingMode 'single'.", status: 400 };
  }
  if (pricingMode === "lines" && (!input.priceLines || input.priceLines.length === 0)) {
    return { ok: false, error: "'priceLines' é obrigatório para pricingMode 'lines'.", status: 400 };
  }

  let photos: { path: string; alt: string }[];
  try {
    photos = await resolvePhotoInputs(input.photos ?? []);
  } catch (e) {
    const status = e instanceof PhotoInputError ? 400 : 500;
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao processar fotos.", status };
  }

  const supabase = createServiceRoleClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      category_id: category.id,
      name: input.name,
      description: input.description ?? "",
      note: input.note || null,
      kit_label: input.kitLabel || null,
      pricing_mode: pricingMode,
      price_cents: priceCents,
      is_active: input.isActive ?? true,
    })
    .select("id")
    .single();

  if (error || !product) return { ok: false, error: error?.message ?? "Falha ao criar produto.", status: 500 };

  if (pricingMode === "lines" && input.priceLines) {
    const rows = input.priceLines.map((line, i) => ({
      product_id: product.id,
      label: line.label,
      price_cents: parsePriceToCents(line.price) ?? 0,
      position: i,
    }));
    const { error: linesError } = await supabase.from("product_prices").insert(rows);
    if (linesError) return { ok: false, error: linesError.message, status: 500 };
  }

  if (photos.length > 0) {
    const rows = photos.map((p, i) => ({
      product_id: product.id,
      path: p.path,
      alt: p.alt || input.name,
      position: i,
    }));
    const { error: photosError } = await supabase.from("product_photos").insert(rows);
    if (photosError) return { ok: false, error: photosError.message, status: 500 };
  }

  revalidatePath("/");
  revalidatePath("/admin/products");

  const result = await fetchApiProduct(product.id);
  return { ok: true, data: result! };
}

export type UpdateProductInput = {
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

export async function updateApiProduct(id: string, input: UpdateProductInput): Promise<ApiResult<ApiProduct>> {
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("products")
    .select(`*, product_photos (*)`)
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Produto não encontrado.", status: 404 };

  const productUpdate: TablesUpdate<"products"> = {};

  if (input.category !== undefined) {
    const category = await resolveCategory(input.category);
    if (!category) return { ok: false, error: `Categoria '${input.category}' não encontrada.`, status: 404 };
    productUpdate.category_id = category.id;
  }
  if (input.name !== undefined) productUpdate.name = input.name;
  if (input.description !== undefined) productUpdate.description = input.description;
  if (input.note !== undefined) productUpdate.note = input.note || null;
  if (input.kitLabel !== undefined) productUpdate.kit_label = input.kitLabel || null;
  if (input.isActive !== undefined) productUpdate.is_active = input.isActive;

  const pricingChanged = input.pricingMode !== undefined || input.price !== undefined || input.priceLines !== undefined;
  const pricingMode = input.pricingMode ?? (existing.pricing_mode as "single" | "lines");

  if (pricingChanged) {
    if (pricingMode === "single") {
      const priceCents = input.price ? parsePriceToCents(input.price) : existing.price_cents;
      if (priceCents === null) {
        return { ok: false, error: "'price' inválido para pricingMode 'single'.", status: 400 };
      }
      productUpdate.pricing_mode = "single";
      productUpdate.price_cents = priceCents;
    } else {
      if (!input.priceLines || input.priceLines.length === 0) {
        return { ok: false, error: "'priceLines' é obrigatório para pricingMode 'lines'.", status: 400 };
      }
      productUpdate.pricing_mode = "lines";
      productUpdate.price_cents = null;
    }
  }

  if (Object.keys(productUpdate).length > 0) {
    const { error } = await supabase.from("products").update(productUpdate).eq("id", id);
    if (error) return { ok: false, error: error.message, status: 500 };
  }

  if (pricingChanged) {
    const { error: deleteError } = await supabase.from("product_prices").delete().eq("product_id", id);
    if (deleteError) return { ok: false, error: deleteError.message, status: 500 };
    if (pricingMode === "lines" && input.priceLines) {
      const rows = input.priceLines.map((line, i) => ({
        product_id: id,
        label: line.label,
        price_cents: parsePriceToCents(line.price) ?? 0,
        position: i,
      }));
      const { error: linesError } = await supabase.from("product_prices").insert(rows);
      if (linesError) return { ok: false, error: linesError.message, status: 500 };
    }
  }

  const photosTouched = input.photos !== undefined || input.addPhotos !== undefined || input.removePhotoPaths !== undefined;
  if (photosTouched) {
    const currentPhotos = (existing.product_photos as { path: string; alt: string | null; position: number }[]).sort(
      (a, b) => a.position - b.position
    );

    let nextPhotos: { path: string; alt: string }[];
    try {
      if (input.photos !== undefined) {
        nextPhotos = await resolvePhotoInputs(input.photos);
      } else {
        const toRemove = new Set(input.removePhotoPaths ?? []);
        const kept = currentPhotos.filter((p) => !toRemove.has(p.path)).map((p) => ({ path: p.path, alt: p.alt ?? "" }));
        const added = await resolvePhotoInputs(input.addPhotos ?? []);
        nextPhotos = [...kept, ...added];
      }
    } catch (e) {
      const status = e instanceof PhotoInputError ? 400 : 500;
      return { ok: false, error: e instanceof Error ? e.message : "Falha ao processar fotos.", status };
    }

    const { error: deletePhotosError } = await supabase.from("product_photos").delete().eq("product_id", id);
    if (deletePhotosError) return { ok: false, error: deletePhotosError.message, status: 500 };

    if (nextPhotos.length > 0) {
      const rows = nextPhotos.map((p, i) => ({
        product_id: id,
        path: p.path,
        alt: p.alt || (input.name ?? existing.name),
        position: i,
      }));
      const { error: photosError } = await supabase.from("product_photos").insert(rows);
      if (photosError) return { ok: false, error: photosError.message, status: 500 };
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
  return { ok: true, data: result! };
}

export async function deleteApiProduct(id: string): Promise<ApiResult<{ ok: true }>> {
  const supabase = createServiceRoleClient();

  const { data: photos } = await supabase.from("product_photos").select("path").eq("product_id", id);

  const { error, count } = await supabase.from("products").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: error.message, status: 500 };
  if (!count) return { ok: false, error: "Produto não encontrado.", status: 404 };

  if (photos && photos.length > 0) {
    await supabase.storage.from("product-photos").remove(photos.map((p) => p.path));
  }

  revalidatePath("/");
  revalidatePath("/admin/products");

  return { ok: true, data: { ok: true } };
}
