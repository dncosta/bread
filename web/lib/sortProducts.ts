export type ProductSortMode = "alphabetical" | "price_desc" | "price_asc";

type SortableProduct = {
  name: string;
  pricing_mode: string;
  price_cents: number | null;
  product_prices: { price_cents: number }[];
};

/** For price-lines products, the lowest line is the product's effective price — same convention the original static site used for its price-sorted layout. */
function effectivePriceCents(product: SortableProduct): number {
  if (product.pricing_mode === "single") return product.price_cents ?? 0;
  if (product.product_prices.length === 0) return 0;
  return Math.min(...product.product_prices.map((l) => l.price_cents));
}

export function sortProductsByMode<T extends SortableProduct>(products: T[], mode: string): T[] {
  const sorted = [...products];
  if (mode === "price_desc") {
    sorted.sort((a, b) => effectivePriceCents(b) - effectivePriceCents(a));
  } else if (mode === "price_asc") {
    sorted.sort((a, b) => effectivePriceCents(a) - effectivePriceCents(b));
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
  return sorted;
}
