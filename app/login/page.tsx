"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true); setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) setError("Email o contraseña incorrectos");
    else window.location.href = "/";
  }
  return (
    <div className="mx-auto mt-20 max-w-sm card">
      <h1 className="mb-1 text-xl font-bold text-navy">CRM Comercial</h1>
      <p className="mb-4 text-sm text-slate-500">Usa tu usuario del Portal Compras.</p>
      <form onSubmit={entrar} className="space-y-3">
        <div><label className="lbl">Email</label><input className="inp" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="lbl">Contraseña</label><input className="inp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={cargando}>{cargando ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}
