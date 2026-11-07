"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCategory, reorderCategories } from "@/app/actions/categories";
import type { Category } from "@/lib/types";

export function CategoryTable({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [items, setItems] = useState(categories);
  const [prevCategories, setPrevCategories] = useState(categories);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Reset local drag order when the server data changes underneath (e.g.
  // after a delete) — adjusting state during render, per React's own
  // guidance, instead of a useEffect that would cause an extra render.
  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setItems(categories);
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Apagar a categoria "${c.name}"?`)) return;
    setPendingId(c.id);
    setError(null);
    const result = await deleteCategory(c.id);
    if (result.error) setError(result.error);
    setPendingId(null);
    router.refresh();
  }

  function handleDrop(targetId: string) {
    const fromId = dragId.current;
    dragId.current = null;
    setDragOverId(null);
    if (!fromId || fromId === targetId) return;

    const fromIndex = items.findIndex((c) => c.id === fromId);
    const toIndex = items.findIndex((c) => c.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
    reorderCategories(next.map((c) => c.id)).then(() => router.refresh());
  }

  return (
    <div>
      {error && <div className="admin-error">{error}</div>}
      <p className="admin-help">Arraste pelo ⠿ para reordenar.</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Nome</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr
              key={c.id}
              style={{
                opacity: pendingId === c.id ? 0.5 : 1,
                background: dragOverId === c.id ? "#f1e6d5" : undefined,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverId !== c.id) setDragOverId(c.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(c.id);
              }}
            >
              <td
                draggable
                onDragStart={() => {
                  dragId.current = c.id;
                }}
                onDragEnd={() => {
                  dragId.current = null;
                  setDragOverId(null);
                }}
                style={{ cursor: "grab", color: "#8a7362", fontSize: 16, userSelect: "none" }}
                aria-label="Arrastar para reordenar"
              >
                ⠿
              </td>
              <td>{c.name}</td>
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
