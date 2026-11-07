"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

export type CategoryInput = {
  name: string;
};

export async function createCategory(input: CategoryInput) {
  const supabase = await createClient();

  const { data: maxPos } = await supabase
    .from("categories")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("categories").insert({
    name: input.name,
    slug: slugify(input.name),
    position: (maxPos?.position ?? -1) + 1,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { error: null };
}

export async function updateCategory(id: string, input: CategoryInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: input.name, slug: slugify(input.name) })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { error: null };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    // Postgres FK violation (category still has products): surface a
    // specific, actionable message instead of the raw DB error.
    if (error.code === "23503") {
      return { error: "Essa categoria ainda tem produtos. Mova ou apague os produtos dela primeiro." };
    }
    return { error: error.message };
  }
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { error: null };
}

/** Persists a full drag-and-drop reorder: `orderedIds` is every category id in its new display order. */
export async function reorderCategories(orderedIds: string[]) {
  const supabase = await createClient();

  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("categories").update({ position: index }).eq("id", id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { error: null };
}

export type ProductSortMode = "alphabetical" | "price_desc" | "price_asc";

export async function updateCategoryProductSort(id: string, mode: ProductSortMode) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ product_sort_mode: mode }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  return { error: null };
}
