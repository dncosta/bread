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

export async function reorderCategory(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: categories } = await supabase.from("categories").select("id, position").order("position");
  if (!categories) return { error: "Falha ao carregar categorias." };

  const index = categories.findIndex((c) => c.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= categories.length) {
    return { error: null };
  }

  const a = categories[index];
  const b = categories[swapIndex];

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase.from("categories").update({ position: b.position }).eq("id", a.id),
    supabase.from("categories").update({ position: a.position }).eq("id", b.id),
  ]);

  const error = errorA ?? errorB;
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/categories");
  return { error: null };
}
