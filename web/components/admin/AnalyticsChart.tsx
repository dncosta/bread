"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { ProductMetric } from "@/lib/analytics/queries";

export function AnalyticsChart({ data, color }: { data: ProductMetric[]; color: string }) {
  if (data.length === 0) {
    return <p className="admin-help">Sem dados nesse período ainda.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="total" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
