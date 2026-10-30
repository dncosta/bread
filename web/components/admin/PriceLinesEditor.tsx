"use client";

import type { PriceLineInput } from "@/app/actions/products";

export function PriceLinesEditor({
  lines,
  onChange,
}: {
  lines: PriceLineInput[];
  onChange: (lines: PriceLineInput[]) => void;
}) {
  function update(i: number, patch: Partial<PriceLineInput>) {
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function remove(i: number) {
    onChange(lines.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...lines, { label: "", price: "" }]);
  }

  return (
    <div className="admin-price-lines">
      {lines.map((line, i) => (
        <div key={i} className="admin-price-line-row">
          <input
            type="text"
            placeholder="Ex.: Kit com 15 un."
            value={line.label}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <input
            type="text"
            placeholder="R$ 00,00"
            value={line.price}
            onChange={(e) => update(i, { price: e.target.value })}
          />
          <button type="button" className="admin-link-btn admin-link-btn--danger" onClick={() => remove(i)}>
            Remover
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn admin-btn--secondary" onClick={add}>
        + Adicionar preço
      </button>
    </div>
  );
}
