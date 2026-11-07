/** Parses a "40,00" / "40.00" / "40" style price string into integer cents. */
export function parsePriceToCents(price: string): number | null {
  const normalized = price.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}
