"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    const redirect = searchParams.get("redirect") || "/admin/products";
    router.push(redirect);
    router.refresh();
  }

  return (
    <form className="admin-login-card" onSubmit={handleSubmit}>
      <h1 className="admin-login-title">Área da Sarah</h1>
      <p className="admin-login-sub">Painel de produtos — Sarah Pães Artesanais</p>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="admin-field">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="admin-btn admin-btn--block" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
