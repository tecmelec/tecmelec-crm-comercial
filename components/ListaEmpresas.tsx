"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TIPOS_EMPRESA } from "@/lib/constantes";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ListaEmpresas({ empresas }: { empresas: any[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [nueva, setNueva] = useState({ nombre: "", tipo: "constructora" });
  const lista = useMemo(() => empresas.filter((e) =>
    (!tipo || e.tipo === tipo) && (!q || [e.nombre, e.obras_vinculadas, e.subtipo].join(" ").toLowerCase().includes(q.toLowerCase()))), [empresas, q, tipo]);
  async function crear() {
    if (!nueva.nombre) return;
    const { data, error } = await supabaseBrowser().from("crm_empresas").insert(nueva).select("id").single();
    if (error) return alert(error.message);
    router.push(`/empresas/${data.id}`);
  }
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-navy">Empresas ({lista.length})</h1>
      <div className="card grid grid-cols-1 gap-2 md:grid-cols-4">
        <input className="inp md:col-span-2" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="inp" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos los tipos</option>{TIPOS_EMPRESA.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <div className="card flex flex-wrap items-end gap-2">
        <div className="grow"><label className="lbl">Nueva empresa</label><input className="inp" value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} /></div>
        <select className="inp w-40" value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })}>{TIPOS_EMPRESA.map((t) => <option key={t}>{t}</option>)}</select>
        <button className="btn" onClick={crear}>Añadir</button>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[800px]">
          <thead><tr><th className="th">Empresa</th><th className="th">Tipo</th><th className="th">Obras vinculadas</th><th className="th">Cargos objetivo</th><th className="th">Opps.</th><th className="th">Contactos</th></tr></thead>
          <tbody>{lista.map((e) => (
            <tr key={e.id}>
              <td className="td"><Link className="text-navy underline" href={`/empresas/${e.id}`}>{e.nombre}</Link><div className="text-xs text-slate-500">{e.subtipo}</div></td>
              <td className="td text-xs">{e.tipo}</td><td className="td text-xs">{e.obras_vinculadas}</td><td className="td text-xs">{e.cargos_objetivo}</td>
              <td className="td text-center">{e.nOpp}</td><td className="td text-center">{e.nCon}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
