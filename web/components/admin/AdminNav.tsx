"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/admin/products", label: "Produtos" },
  { href: "/admin/categories", label: "Categorias" },
  { href: "/admin/analytics", label: "Analytics" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <div className="admin-topbar">
        <span className="admin-topbar-brand">Sarah — Painel</span>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={handleSignOut}>
          Sair
        </button>
      </div>
      <nav className="admin-tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`admin-tab${pathname?.startsWith(tab.href) ? " active" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
