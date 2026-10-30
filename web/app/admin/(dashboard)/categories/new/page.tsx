import { CategoryForm } from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div>
      <div className="admin-header-row">
        <h1 className="admin-title">Nova categoria</h1>
      </div>
      <CategoryForm />
    </div>
  );
}
