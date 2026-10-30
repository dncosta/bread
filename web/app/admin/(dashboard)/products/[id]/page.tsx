import { notFound } from "next/navigation";
import { getAllCategories, getProductById } from "@/lib/adminData";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, product] = await Promise.all([getAllCategories(), getProductById(id)]);

  if (!product) notFound();

  return (
    <div>
      <div className="admin-header-row">
        <h1 className="admin-title">Editar produto</h1>
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
