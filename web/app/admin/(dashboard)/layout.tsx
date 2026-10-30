import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import "../admin.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: proxy.ts already guards /admin/*, but re-check here
  // too (Supabase's own recommended pattern) in case this route is ever
  // reached through a path the proxy matcher doesn't cover.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      <AdminNav />
      <main className="admin-main">{children}</main>
    </div>
  );
}
