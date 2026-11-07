import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Vercel Cron hits this on a schedule (see vercel.json) just to touch the
// database — Supabase's free tier auto-pauses a project after ~7 days with
// no activity, and this keeps that from ever happening.
export async function GET(request: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("categories").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
}
