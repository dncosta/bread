"use server";

import { getTopProducts, type ProductMetric } from "@/lib/analytics/queries";

export async function fetchTopProducts(
  days: number | null
): Promise<{ views: ProductMetric[]; whatsappClicks: ProductMetric[] }> {
  const [views, whatsappClicks] = await Promise.all([
    getTopProducts("views", days),
    getTopProducts("whatsapp_clicks", days),
  ]);
  return { views, whatsappClicks };
}
