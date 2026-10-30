import { getAllCategories } from "@/lib/adminData";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <div>
      <div className="admin-header-row">
        <h1 className="admin-title">Novo produto</h1>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
