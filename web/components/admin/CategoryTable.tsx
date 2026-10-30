"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCategory, reorderCategory } from "@/app/actions/categories";
import type { Category } from "@/lib/types";

export function CategoryTable({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(c: Category) {
    if (!confirm(`Apagar a categoria "${c.name}"?`)) return;
    setPendingId(c.id);
    setError(null);
    const result = await deleteCategory(c.id);
    if (result.error) setError(result.error);
    setPendingId(null);
    router.refresh();
  }

  async function handleReorder(c: Category, direction: "up" | "down") {
    setPendingId(c.id);
    await reorderCategory(c.id, direction);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div>
      {error && <div className="admin-error">{error}</div>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Ordem</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} style={{ opacity: pendingId === c.id ? 0.5 : 1 }}>
              <td>{c.name}</td>
              <td>
                <div className="admin-row-actions">
                  <button type="button" className="admin-link-btn" onClick={() => handleReorder(c, "up")}>
                    ↑
                  </button>
                  <button type="button" className="admin-link-btn" onClick={() => handleReorder(c, "down")}>
                    ↓
                  </button>
                </div>
              </td>
              <td>
                <div className="admin-row-actions">
                  <Link href={`/admin/categories/${c.id}`} className="admin-link-btn">
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="admin-link-btn admin-link-btn--danger"
                    onClick={() => handleDelete(c)}
                  >
                    Apagar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
