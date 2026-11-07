import { createServiceRoleClient } from "@/lib/supabase/server";
import { serializeProduct, type ApiProduct } from "@/lib/apiSerialize";
import { uploadPhotoFromBase64 } from "@/lib/apiPhotos";
import type { Category, Product, ProductPhoto, ProductPrice } from "@/lib/types";

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
  let query = supabase.from("products").select(PRODUCT_SELECT).order("position");

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
