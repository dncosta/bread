import { createClient } from "@/lib/supabase/server";
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
  const { data, error } = await supabase
    .from("products")
    .select(`*, product_prices (*), categories (*)`)
    .order("category_id")
    .order("position");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminProduct[];
}

export async function getProductById(id: string): Promise<ProductWithPrices | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`*, product_prices (*)`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as ProductWithPrices | null;
}
