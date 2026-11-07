import { NextResponse, type NextRequest } from "next/server";

/**
 * Shared bearer-token check for the external /api/v1 surface (consumed by
 * the Gemini Gem, not by the admin UI — that uses Supabase session auth
 * instead). Returns a 401/500 response to short-circuit the route, or null
 * when the request is authorized.
 */
export function checkApiKey(request: NextRequest): NextResponse | null {
  const expected = process.env.PRODUCTS_API_KEY;
  if (!expected) {
    return NextResponse.json({ error: "PRODUCTS_API_KEY not configured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
