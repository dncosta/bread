"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, type ProductInput, type PriceLineInput } from "@/app/actions/products";
import { PhotoUploader } from "./PhotoUploader";
import { PriceLinesEditor } from "./PriceLinesEditor";
import type { Category } from "@/lib/types";
import type { ProductWithPrices } from "@/lib/types";

function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductWithPrices;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [note, setNote] = useState(product?.note ?? "");
  const [kitLabel, setKitLabel] = useState(product?.kit_label ?? "");
  const [photoAlt, setPhotoAlt] = useState(product?.photo_alt ?? "");
  const [photoPath, setPhotoPath] = useState<string | null>(product?.photo_path ?? null);
  const [pricingMode, setPricingMode] = useState<"single" | "lines">(
    (product?.pricing_mode as "single" | "lines") ?? "single"
  );
  const [price, setPrice] = useState(centsToInput(product?.price_cents));
  const [priceLines, setPriceLines] = useState<PriceLineInput[]>(
    product?.product_prices.map((l) => ({ label: l.label, price: centsToInput(l.price_cents) })) ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const input: ProductInput = {
      categoryId,
      name,
      description,
      note,
      kitLabel,
      photoAlt,
      photoPath,
      pricingMode,
      price,
      priceLines,
    };

    const result = product ? await updateProduct(product.id, input) : await createProduct(input);

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/products");
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-field">
        <label htmlFor="category">Categoria</label>
        <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-field">
        <label htmlFor="name">Nome do produto</label>
        <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="admin-field">
        <label htmlFor="description">Descrição</label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="admin-field">
        <label htmlFor="note">Observação (itálico, opcional)</label>
        <input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="kit">Kit / peso (opcional)</label>
          <input
            id="kit"
            type="text"
            placeholder="Ex.: 250g ou Kit com 4 un."
            value={kitLabel}
            onChange={(e) => setKitLabel(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="alt">Texto alternativo da foto</label>
          <input
            id="alt"
            type="text"
            placeholder={name || "Nome do produto"}
            value={photoAlt}
            onChange={(e) => setPhotoAlt(e.target.value)}
          />
        </div>
      </div>

      <PhotoUploader value={photoPath} onChange={setPhotoPath} />

      <div className="admin-field">
        <label>Tipo de preço</label>
        <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="radio"
              name="pricingMode"
              checked={pricingMode === "single"}
              onChange={() => setPricingMode("single")}
            />
            Preço único
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="radio"
              name="pricingMode"
              checked={pricingMode === "lines"}
              onChange={() => setPricingMode("lines")}
            />
            Vários preços (kits)
          </label>
        </div>
      </div>

      {pricingMode === "single" ? (
        <div className="admin-field">
          <label htmlFor="price">Preço (R$)</label>
          <input id="price" type="text" placeholder="00,00" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      ) : (
        <div className="admin-field">
          <label>Preços por kit</label>
          <PriceLinesEditor lines={priceLines} onChange={setPriceLines} />
        </div>
      )}

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={() => router.push("/admin/products")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
