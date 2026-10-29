import { createClient } from "@/lib/supabase/server";
import type { CategoryWithProducts } from "@/lib/types";

/**
 * Active categories with their active products (and each product's price
 * lines), ordered exactly as the public site should render them. Relies on
 * RLS: the anon role only ever sees active rows.
 */
export async function getCategoriesWithProducts(): Promise<
  CategoryWithProducts[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      *,
      products:products!inner (
        *,
        product_prices (*)
      )
    `
    )
    .order("position", { ascending: true })
    .order("position", { referencedTable: "products", ascending: true });

  if (error) {
    throw new Error(`Failed to load categories/products: ${error.message}`);
  }

  const categories = (data ?? []) as unknown as CategoryWithProducts[];

  // Sort each product's price lines client-side — more reliable than
  // chaining a second-level `.order()` on a doubly-nested PostgREST
  // embed, and the row counts here are tiny (2-3 lines per product).
  for (const category of categories) {
    for (const product of category.products) {
      product.product_prices.sort((a, b) => a.position - b.position);
    }
  }

  // `!inner` means a category with zero active products is dropped
  // entirely — matches the current site, which never shows an empty
  // category section.
  return categories;
}
