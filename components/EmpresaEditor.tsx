"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { TIPOS_EMPRESA } from "@/lib/constantes";

export default function EmpresaEditor({ empresa, contactos }: { empresa: any; contactos: any[] }) {
  const router = useRouter();
  const [e, setE] = useState<any>(empresa);
  const [c, setC] = useState<any>({ nombre: "", cargo: "", email: "", telefono: "", linkedin: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: string, v: any) => setE((x: any) => ({ ...x, [k]: v }));
  async function guardar() {
    const { id, created_at, updated_at, datos, ...rest } = e;
    const { error } = await supabaseBrowser().from("crm_empresas").update(rest).eq("id", id);
    setMsg(error ? error.message : "Guardado"); router.refresh();
  }
  async function addContacto() {
    if (!c.nombre) return;
    const { error } = await supabaseBrowser().from("crm_contactos").insert({ ...c, empresa_id: empresa.id });
    if (error) return setMsg(error.message);
    setC({ nombre: "", cargo: "", email: "", telefono: "", linkedin: "" }); router.refresh();
  }
  return (
    <>
      <div className="card grid gap-3 md:grid-cols-2">
        <div><label className="lbl">Nombre</label><input className="inp" value={e.nombre ?? ""} onChange={(x) => set("nombre", x.target.value)} /></div>
        <div><label className="lbl">Tipo</label><select className="inp" value={e.tipo} onChange={(x) => set("tipo", x.target.value)}>{TIPOS_EMPRESA.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label className="lbl">Ciudad</label><input className="inp" value={e.ciudad ?? ""} onChange={(x) => set("ciudad", x.target.value)} /></div>
        <div><label className="lbl">Web</label><input className="inp" value={e.web ?? ""} onChange={(x) => set("web", x.target.value)} /></div>
        {[["subtipo", "Descripción"], ["obras_vinculadas", "Obras vinculadas"], ["cargos_objetivo", "Cargos a contactar"], ["estrategia", "Estrategia de entrada"]].map(([k, n]) => (
          <div key={k} className="md:col-span-2"><label className="lbl">{n}</label><input className="inp" value={e[k] ?? ""} onChange={(x) => set(k, x.target.value)} /></div>
        ))}
        <div className="md:col-span-2"><label className="lbl">Notas</label><textarea rows={3} className="inp" value={e.notas ?? ""} onChange={(x) => set("notas", x.target.value)} /></div>
        <div className="flex items-center gap-2"><button className="btn" onClick={guardar}>Guardar</button>{msg && <span className="text-sm">{msg}</span>}</div>
      </div>
      <div className="card">
        <h3 className="mb-2 font-bold text-navy">Contactos ({contactos.length})</h3>
        <table className="mb-3 w-full"><thead><tr><th className="th">Nombre</th><th className="th">Cargo</th><th className="th">Email</th><th className="th">Teléfono</th><th className="th">LinkedIn</th></tr></thead>
          <tbody>{contactos.map((x) => (
            <tr key={x.id}><td className="td">{x.nombre}</td><td className="td">{x.cargo}</td>
              <td className="td">{x.email && <a className="underline" href={`mailto:${x.email}`}>{x.email}</a>}</td>
              <td className="td">{x.telefono && <a className="underline" href={`tel:${x.telefono}`}>{x.telefono}</a>}</td>
              <td className="td">{x.linkedin && <a className="underline" href={x.linkedin} target="_blank" rel="noreferrer">perfil</a>}</td></tr>))}</tbody></table>
        <div className="grid gap-2 md:grid-cols-5">
          {["nombre", "cargo", "email", "telefono", "linkedin"].map((k) => (
            <input key={k} className="inp" placeholder={k} value={c[k]} onChange={(x) => setC({ ...c, [k]: x.target.value })} />
          ))}
        </div>
        <button className="btn-sec mt-2" onClick={addContacto}>+ Añadir contacto</button>
      </div>
    </>
  );
}
