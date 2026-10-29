import type { Tables } from "@/lib/database.types";

export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductPrice = Tables<"product_prices">;

export type ProductWithPrices = Product & {
  product_prices: ProductPrice[];
};

export type CategoryWithProducts = Category & {
  products: ProductWithPrices[];
};
