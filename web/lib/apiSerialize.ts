import { getPhotoUrl } from "@/lib/storage";
import { formatPriceCents } from "@/lib/format";
import type { Category, ProductPhoto, ProductPrice, Product } from "@/lib/types";

export type ApiProduct = {
  id: string;
  name: string;
  description: string;
  note: string | null;
  kitLabel: string | null;
  isActive: boolean;
  position: number;
  category: { id: string; slug: string; name: string };
  pricing:
    | { mode: "single"; price: string | null; priceCents: number | null }
    | { mode: "lines"; lines: { label: string; price: string; priceCents: number }[] };
  photos: { path: string; url: string | null; alt: string | null; position: number }[];
};

export function serializeProduct(
  product: Product,
  category: Category,
  prices: ProductPrice[],
  photos: ProductPhoto[]
): ApiProduct {
  const sortedPhotos = [...photos].sort((a, b) => a.position - b.position);
  const sortedPrices = [...prices].sort((a, b) => a.position - b.position);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    note: product.note,
    kitLabel: product.kit_label,
    isActive: product.is_active,
    position: product.position,
    category: { id: category.id, slug: category.slug, name: category.name },
    pricing:
      product.pricing_mode === "lines"
        ? {
            mode: "lines",
            lines: sortedPrices.map((l) => ({
              label: l.label,
              price: formatPriceCents(l.price_cents),
              priceCents: l.price_cents,
            })),
          }
        : {
            mode: "single",
            price: product.price_cents != null ? formatPriceCents(product.price_cents) : null,
            priceCents: product.price_cents,
          },
    photos: sortedPhotos.map((p) => ({
      path: p.path,
      url: getPhotoUrl(p.path),
      alt: p.alt,
      position: p.position,
    })),
  };
}
