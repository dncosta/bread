import { getCategoriesWithProducts } from "@/lib/data";
import { Hero } from "@/components/public/Hero";
import { NatalBanner } from "@/components/public/NatalBanner";
import { SearchNav } from "@/components/public/SearchNav";
import { CategorySection } from "@/components/public/CategorySection";

export const revalidate = 3600;

export default async function HomePage() {
  const categories = await getCategoriesWithProducts();

  return (
    <div className="wrap">
      <Hero>
        <NatalBanner />
      </Hero>
      <SearchNav categories={categories} />
      {categories.map((category) => (
        <CategorySection key={category.id} category={category} />
      ))}
      <div className="footer" />
    </div>
  );
}
