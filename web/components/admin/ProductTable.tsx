"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setProductActive, deleteProduct } from "@/app/actions/products";
import { updateCategoryProductSort, type ProductSortMode } from "@/app/actions/categories";
import { formatPriceCents } from "@/lib/format";
import { getPhotoUrl } from "@/lib/storage";
import type { AdminProduct } from "@/lib/adminData";
import type { Category } from "@/lib/types";

const SORT_LABELS: Record<ProductSortMode, string> = {
  alphabetical: "Ordem alfabética",
  price_desc: "Preço — Maior pro Menor",
  price_asc: "Preço — Menor pro Maior",
};

export function ProductTable({ products, categories }: { products: AdminProduct[]; categories: Category[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [sortSaving, setSortSaving] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryFilter) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "paused" && p.is_active) return false;
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  async function handleToggleActive(p: AdminProduct) {
    setPendingId(p.id);
    await setProductActive(p.id, !p.is_active);
    setPendingId(null);
    router.refresh();
  }

  async function handleDelete(p: AdminProduct) {
    if (!confirm(`Apagar "${p.name}" permanentemente? Essa ação não pode ser desfeita.`)) return;
    setPendingId(p.id);
    await deleteProduct(p.id);
    setPendingId(null);
    router.refresh();
  }

  async function handleSortModeChange(mode: ProductSortMode) {
    if (!selectedCategory) return;
    setSortSaving(true);
    await updateCategoryProductSort(selectedCategory.id, mode);
    setSortSaving(false);
    router.refresh();
  }

  return (
    <div>
      <div className="admin-filters">
        <input
          type="search"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">Ativos e pausados</option>
          <option value="active">Só ativos</option>
          <option value="paused">Só pausados</option>
        </select>
        {selectedCategory && (
          <select
            value={selectedCategory.product_sort_mode}
            onChange={(e) => handleSortModeChange(e.target.value as ProductSortMode)}
            disabled={sortSaving}
            aria-label={`Ordenar produtos de ${selectedCategory.name} por`}
          >
            {(Object.keys(SORT_LABELS) as ProductSortMode[]).map((mode) => (
              <option key={mode} value={mode}>
                Ordenar por: {SORT_LABELS[mode]}
              </option>
            ))}
          </select>
        )}
      </div>
      {selectedCategory && (
        <p className="admin-help">
          Essa ordem vale para todos os produtos de &quot;{selectedCategory.name}&quot; no site público.
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="admin-empty">Nenhum produto encontrado.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const firstPhoto = [...p.product_photos].sort((a, b) => a.position - b.position)[0];
              const photoUrl = getPhotoUrl(firstPhoto?.path ?? null);
              const isPending = pendingId === p.id;
              return (
                <tr key={p.id} style={{ opacity: isPending ? 0.5 : 1 }}>
                  <td>
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt="" className="admin-table-photo" />
                    ) : (
                      <div className="admin-table-photo" />
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>{p.categories?.name}</td>
                  <td>
                    {p.pricing_mode === "single" && p.price_cents != null
                      ? formatPriceCents(p.price_cents)
                      : p.product_prices.length > 0
                        ? `${p.product_prices.length} preços`
                        : "—"}
                  </td>
                  <td>
                    <span className={`admin-badge ${p.is_active ? "admin-badge--active" : "admin-badge--paused"}`}>
                      {p.is_active ? "Ativo" : "Pausado"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link href={`/admin/products/${p.id}`} className="admin-link-btn">
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="admin-link-btn"
                        disabled={isPending}
                        onClick={() => handleToggleActive(p)}
                      >
                        {p.is_active ? "Pausar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        className="admin-link-btn admin-link-btn--danger"
                        disabled={isPending}
                        onClick={() => handleDelete(p)}
                      >
                        Apagar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
