"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PriceLineInput = { label: string; price: string };

export type ProductInput = {
  categoryId: string;
  name: string;
  description: string;
  note: string;
  kitLabel: string;
  photoAlt: string;
  photoPath: string | null;
  pricingMode: "single" | "lines";
  price: string; // "40,00" — only used when pricingMode === "single"
  priceLines: PriceLineInput[]; // only used when pricingMode === "lines"
};

function parsePriceToCents(price: string): number | null {
  const normalized = price.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export async function createProduct(input: ProductInput) {
  const supabase = await createClient();

  const { data: maxPos } = await supabase
    .from("products")
    .select("position")
    .eq("category_id", input.categoryId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const priceCents = input.pricingMode === "single" ? parsePriceToCents(input.price) : null;
  if (input.pricingMode === "single" && priceCents === null) {
    return { error: "Preço inválido." };
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      note: input.note || null,
      kit_label: input.kitLabel || null,
      photo_path: input.photoPath,
      photo_alt: input.photoAlt || input.name,
      pricing_mode: input.pricingMode,
      price_cents: priceCents,
      position: (maxPos?.position ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error || !product) return { error: error?.message ?? "Falha ao criar produto." };

  if (input.pricingMode === "lines" && input.priceLines.length > 0) {
    const rows = input.priceLines.map((line, i) => ({
      product_id: product.id,
      label: line.label,
      price_cents: parsePriceToCents(line.price) ?? 0,
      position: i,
    }));
    const { error: linesError } = await supabase.from("product_prices").insert(rows);
    if (linesError) return { error: linesError.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { error: null, id: product.id as string };
}

export async function updateProduct(id: string, input: ProductInput) {
  const supabase = await createClient();

  const priceCents = input.pricingMode === "single" ? parsePriceToCents(input.price) : null;
  if (input.pricingMode === "single" && priceCents === null) {
    return { error: "Preço inválido." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      note: input.note || null,
      kit_label: input.kitLabel || null,
      photo_path: input.photoPath,
      photo_alt: input.photoAlt || input.name,
      pricing_mode: input.pricingMode,
      price_cents: priceCents,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Replace price lines wholesale — simplest correct approach for a
  // handful of rows per product, avoids diffing add/remove/reorder.
  const { error: deleteError } = await supabase.from("product_prices").delete().eq("product_id", id);
  if (deleteError) return { error: deleteError.message };

  if (input.pricingMode === "lines" && input.priceLines.length > 0) {
    const rows = input.priceLines.map((line, i) => ({
      product_id: id,
      label: line.label,
      price_cents: parsePriceToCents(line.price) ?? 0,
      position: i,
    }));
    const { error: linesError } = await supabase.from("product_prices").insert(rows);
    if (linesError) return { error: linesError.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { error: null };
}

export async function setProductActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/products");
  return { error: null };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  const { data: product } = await supabase.from("products").select("photo_path").eq("id", id).maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  if (product?.photo_path) {
    await supabase.storage.from("product-photos").remove([product.photo_path]);
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { error: null };
}

export async function reorderProduct(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: product } = await supabase.from("products").select("category_id").eq("id", id).maybeSingle();
  if (!product) return { error: "Produto não encontrado." };

  const { data: siblings } = await supabase
    .from("products")
    .select("id, position")
    .eq("category_id", product.category_id)
    .order("position");
  if (!siblings) return { error: "Falha ao carregar produtos." };

  const index = siblings.findIndex((p) => p.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) {
    return { error: null };
  }

  const a = siblings[index];
  const b = siblings[swapIndex];

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase.from("products").update({ position: b.position }).eq("id", a.id),
    supabase.from("products").update({ position: a.position }).eq("id", b.id),
  ]);

  const error = errorA ?? errorB;
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/products");
  return { error: null };
}
