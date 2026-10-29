import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Simple in-memory rate limit: one event per (ip, product, type) per 3s.
// Resets on cold start / isn't shared across instances — acceptable for
// this site's traffic; the point is blocking trivial scripted abuse, not
// perfect accounting.
const recent = new Map<string, number>();
const WINDOW_MS = 3000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < WINDOW_MS) return true;
  recent.set(key, now);
  if (recent.size > 5000) {
    const cutoff = now - WINDOW_MS;
    for (const [k, t] of recent) if (t < cutoff) recent.delete(k);
  }
  return false;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { productId, eventType, location } = (body ?? {}) as {
    productId?: string;
    eventType?: string;
    location?: string;
  };

  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  if (eventType !== "view" && eventType !== "whatsapp_click") {
    return NextResponse.json({ error: "invalid eventType" }, { status: 400 });
  }
  if (location != null && location !== "hero" && location !== "card") {
    return NextResponse.json({ error: "invalid location" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`${ip}:${productId}:${eventType}`)) {
    return NextResponse.json({ ok: true, skipped: "rate-limited" });
  }

  const supabase = createServiceRoleClient();

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "unknown or inactive product" }, { status: 404 });
  }

  const { error } = await supabase.from("analytics_events").insert({
    product_id: productId,
    event_type: eventType,
    location: location ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
