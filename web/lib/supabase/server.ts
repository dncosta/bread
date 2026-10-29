import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Server Component / Server Action client — reads the admin's session from
 * cookies. Respects RLS as the `authenticated` or `anon` role depending on
 * whether a session cookie is present.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render (not an Action/Route
            // Handler) — cookies() can't be mutated there. Safe to ignore
            // since the proxy already refreshes the session on navigation.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS entirely. Server-only; never import
 * this from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the
 * browser. Used by /api/track to write analytics events without a public
 * insert policy.
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
