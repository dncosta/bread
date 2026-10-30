"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory } from "@/app/actions/categories";
import type { Category } from "@/lib/types";

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const result = category ? await updateCategory(category.id, { name }) : await createCategory({ name });

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/categories");
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-field">
        <label htmlFor="name">Nome da categoria</label>
        <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="admin-form-actions">
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={() => router.push("/admin/categories")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
