import { createClient } from "@/lib/supabase/server";
import { sortProductsByMode } from "@/lib/sortProducts";
import type { Category, ProductWithPrices } from "@/lib/types";

export type AdminProduct = ProductWithPrices & { categories: Category };

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("position");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAllProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(`*, product_prices (*), product_photos (*), categories (*)`);
  if (error) throw new Error(error.message);
  const products = (data ?? []) as unknown as AdminProduct[];

  // Group by category (in category.position order), sorted within each
  // group by that category's sort mode — same ordering the public site
  // uses, so the list reads the way it will actually appear online.
  const byCategory = new Map<string, AdminProduct[]>();
  for (const product of products) {
    const list = byCategory.get(product.category_id) ?? [];
    list.push(product);
    byCategory.set(product.category_id, list);
  }

  const categoriesInOrder = [...byCategory.values()]
    .map((list) => list[0].categories)
    .sort((a, b) => a.position - b.position);

  return categoriesInOrder.flatMap((category) =>
    sortProductsByMode(byCategory.get(category.id)!, category.product_sort_mode)
  );
}

export async function getProductById(id: string): Promise<ProductWithPrices | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`*, product_prices (*), product_photos (*)`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as ProductWithPrices | null;
}
