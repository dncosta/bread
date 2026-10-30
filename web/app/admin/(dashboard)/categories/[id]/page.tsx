import { notFound } from "next/navigation";
import { getAllCategories } from "@/lib/adminData";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categories = await getAllCategories();
  const category = categories.find((c) => c.id === id);

  if (!category) notFound();

  return (
    <div>
      <div className="admin-header-row">
        <h1 className="admin-title">Editar categoria</h1>
      </div>
      <CategoryForm category={category} />
    </div>
  );
}
