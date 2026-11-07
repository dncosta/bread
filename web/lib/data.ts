import { createClient } from "@/lib/supabase/server";
import { sortProductsByMode } from "@/lib/sortProducts";
import type { CategoryWithProducts } from "@/lib/types";

/**
 * Active categories with their active products (and each product's price
 * lines), ordered exactly as the public site should render them.
 *
 * `is_active` is filtered explicitly here rather than left to RLS: the
 * `authenticated` role's RLS policy has no is_active restriction (the admin
 * needs to see paused products in its own UI), so if this ever runs with an
 * admin's session cookie attached — e.g. the admin viewing the public page
 * in the same browser they're logged into /admin with — relying on RLS
 * alone would leak paused products onto the public site.
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
        product_prices (*),
        product_photos (*)
      )
    `
    )
    .eq("products.is_active", true)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories/products: ${error.message}`);
  }

  const categories = (data ?? []) as unknown as CategoryWithProducts[];

  for (const category of categories) {
    for (const product of category.products) {
      product.product_prices.sort((a, b) => a.position - b.position);
      product.product_photos.sort((a, b) => a.position - b.position);
    }
    category.products = sortProductsByMode(category.products, category.product_sort_mode);
  }

  // `!inner` means a category with zero active products is dropped
  // entirely — matches the current site, which never shows an empty
  // category section.
  return categories;
}
