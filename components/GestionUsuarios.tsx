"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ROLES } from "@/lib/constantes";

export default function GestionUsuarios({ usuarios, puedeCrear }: { usuarios: any[]; puedeCrear: boolean }) {
  const router = useRouter();
  const [n, setN] = useState({ email: "", nombre: "", rol: "comercial", password: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [pedirPassword, setPedirPassword] = useState(false);
  async function alta() {
    setMsg(null);
    const sb = supabaseBrowser();
    if (pedirPassword) {
      const r = await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n) });
      const j = await r.json();
      setMsg(j.ok ? `Usuario creado. Comunica a ${n.email} su contraseña inicial.` : "Error: " + j.error);
      if (j.ok) { setPedirPassword(false); setN({ email: "", nombre: "", rol: "comercial", password: "" }); router.refresh(); }
      return;
    }
    const { data, error } = await sb.rpc("crm_alta_usuario", { p_email: n.email, p_nombre: n.nombre, p_rol: n.rol });
    if (error) return setMsg("Error: " + error.message);
    if (data === "NO_EXISTE") {
      if (puedeCrear) { setPedirPassword(true); setMsg("Ese email no tiene usuario todavía. Indica una contraseña inicial para crearlo."); }
      else setMsg("Ese email no tiene usuario. Créalo en Supabase (Authentication → Users) o configura SUPABASE_SERVICE_ROLE_KEY en Vercel para crearlo desde aquí.");
      return;
    }
    setMsg("Añadido al CRM."); setN({ email: "", nombre: "", rol: "comercial", password: "" }); router.refresh();
  }
  async function cambiar(id: string, campo: string, valor: any) {
    const { error } = await supabaseBrowser().from("crm_usuarios").update({ [campo]: valor }).eq("user_id", id);
    if (error) alert(error.message); router.refresh();
  }
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-navy">Usuarios del CRM</h1>
      <p className="text-sm text-slate-600">Los usuarios del Portal Compras pueden añadirse con su email: entrarán con la misma contraseña. Roles: <b>lectura</b> solo consulta; <b>admin/direccion</b> gestionan usuarios y pueden borrar.</p>
      <div className="card grid gap-2 md:grid-cols-5">
        <input className="inp" placeholder="email" value={n.email} onChange={(e) => setN({ ...n, email: e.target.value })} />
        <input className="inp" placeholder="nombre" value={n.nombre} onChange={(e) => setN({ ...n, nombre: e.target.value })} />
        <select className="inp" value={n.rol} onChange={(e) => setN({ ...n, rol: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        {pedirPassword && <input className="inp" type="password" placeholder="contraseña inicial (mín. 8)" value={n.password} onChange={(e) => setN({ ...n, password: e.target.value })} />}
        <button className="btn" onClick={alta} disabled={!n.email || !n.nombre}>{pedirPassword ? "Crear usuario" : "Añadir"}</button>
        {msg && <p className="text-sm md:col-span-5">{msg}</p>}
      </div>
      <div className="card p-0">
        <table className="w-full"><thead><tr><th className="th">Nombre</th><th className="th">Email</th><th className="th">Rol</th><th className="th">Activo</th></tr></thead>
          <tbody>{usuarios.map((u) => (
            <tr key={u.user_id}><td className="td">{u.nombre}</td><td className="td">{u.email}</td>
              <td className="td"><select className="inp" value={u.rol} onChange={(e) => cambiar(u.user_id, "rol", e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></td>
              <td className="td"><input type="checkbox" checked={u.activo} onChange={(e) => cambiar(u.user_id, "activo", e.target.checked)} /></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
