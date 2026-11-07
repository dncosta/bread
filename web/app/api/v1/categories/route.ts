import { NextResponse, type NextRequest } from "next/server";
import { checkApiKey } from "@/lib/apiAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("categories").select("id, slug, name, position").order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ categories: data });
}
