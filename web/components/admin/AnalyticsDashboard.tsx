"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchTopProducts } from "@/app/actions/analytics";
import { AnalyticsChart } from "./AnalyticsChart";
import type { ProductMetric } from "@/lib/analytics/queries";

const RANGES: { label: string; days: number | null }[] = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "Tudo", days: null },
];

export function AnalyticsDashboard() {
  const [days, setDays] = useState<number | null>(7);
  const [isPending, startTransition] = useTransition();
  const [views, setViews] = useState<ProductMetric[]>([]);
  const [whatsappClicks, setWhatsappClicks] = useState<ProductMetric[]>([]);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const result = await fetchTopProducts(days);
      if (cancelled) return;
      setViews(result.views);
      setWhatsappClicks(result.whatsappClicks);
    });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div>
      <div className="admin-range-buttons">
        {RANGES.map((r) => (
          <button
            key={r.label}
            type="button"
            className={`admin-range-btn${days === r.days ? " active" : ""}`}
            onClick={() => setDays(r.days)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="admin-help">Carregando...</p>
      ) : (
        <div className="admin-charts">
          <div className="admin-chart-card">
            <p className="admin-chart-title">Mais vistos</p>
            <AnalyticsChart data={views} color="#C98A3C" />
          </div>
          <div className="admin-chart-card">
            <p className="admin-chart-title">Mais pedidos via WhatsApp</p>
            <AnalyticsChart data={whatsappClicks} color="#3C6B2F" />
          </div>
        </div>
      )}
    </div>
  );
}
