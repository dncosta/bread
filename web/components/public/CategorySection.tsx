import { ProductCard } from "./ProductCard";
import type { CategoryWithProducts } from "@/lib/types";

export function CategorySection({ category }: { category: CategoryWithProducts }) {
  return (
    <section id={category.slug} className="cat-section">
      <div className="section-head">
        <div className="section-title">{category.name}</div>
        <div className="section-rule" />
      </div>
      <div className="section-body">
        <div className="grid">
          {category.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
