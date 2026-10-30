import Link from "next/link";
import { getAllCategories } from "@/lib/adminData";
import { CategoryTable } from "@/components/admin/CategoryTable";

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div>
      <div className="admin-header-row">
        <h1 className="admin-title">Categorias</h1>
        <Link href="/admin/categories/new" className="admin-btn">
          + Nova categoria
        </Link>
      </div>
      <CategoryTable categories={categories} />
    </div>
  );
}
