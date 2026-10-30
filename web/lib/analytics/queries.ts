import { createClient } from "@/lib/supabase/server";

export type ProductMetric = { productId: string; name: string; total: number };

/**
 * Top products by views or whatsapp_clicks over the last `days` days (or
 * all time when `days` is null), read from the pre-aggregated daily
 * rollup table — fast regardless of how much raw event history exists.
 */
export async function getTopProducts(
  metric: "views" | "whatsapp_clicks",
  days: number | null
): Promise<ProductMetric[]> {
  const supabase = await createClient();

  let query = supabase.from("analytics_daily_counts").select(`product_id, ${metric}, products (name)`);

  if (days != null) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte("day", since.toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  type Row = { product_id: string; products: { name: string } | null; views?: number; whatsapp_clicks?: number };

  const totals = new Map<string, { name: string; total: number }>();
  for (const row of (data ?? []) as unknown as Row[]) {
    const productId = row.product_id;
    const name = row.products?.name ?? "—";
    const value = row[metric] ?? 0;
    const existing = totals.get(productId);
    if (existing) {
      existing.total += value;
    } else {
      totals.set(productId, { name, total: value });
    }
  }

  return Array.from(totals.entries())
    .map(([productId, v]) => ({ productId, name: v.name, total: v.total }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}
