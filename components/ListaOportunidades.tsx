"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ETAPAS, etapaNombre, PRIORIDADES, PRIO_COLOR } from "@/lib/constantes";
import { meur, fecha } from "@/lib/format";

export default function ListaOportunidades({ opps, usuarios }: { opps: any[]; usuarios: any[] }) {
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState("");
  const [etapa, setEtapa] = useState("activas");
  const [resp, setResp] = useState("");
  const [orden, setOrden] = useState<"prio" | "potencial" | "accion">("prio");
  const lista = useMemo(() => {
    const t = q.toLowerCase();
    let l = opps.filter((o) =>
      (!t || [o.codigo, o.proyecto, o.ciudad, o.constructor, o.tipo_activo].join(" ").toLowerCase().includes(t)) &&
      (!prio || o.prioridad === prio) &&
      (!resp || o.responsable_id === resp) &&
      (etapa === "" || (etapa === "activas" ? !["X", "Z", "0", "9"].includes(o.etapa) : o.etapa === etapa)));
    const po = (p: string) => PRIORIDADES.indexOf(p);
    l = [...l].sort((a, b) =>
      orden === "prio" ? po(a.prioridad) - po(b.prioridad) || Number(b.potencial_meur) - Number(a.potencial_meur)
      : orden === "potencial" ? Number(b.potencial_meur) - Number(a.potencial_meur)
      : String(a.fecha_proxima_accion ?? "9999").localeCompare(String(b.fecha_proxima_accion ?? "9999")));
    return l;
  }, [opps, q, prio, etapa, resp, orden]);
  const total = lista.reduce((s, o) => s + Number(o.potencial_meur ?? 0), 0);
  const nombre = (id: string) => usuarios.find((u) => u.user_id === id)?.nombre ?? "—";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <h1 className="mr-auto text-lg font-bold text-navy">Oportunidades ({lista.length}) · potencial {meur(total, 1)}</h1>
        <Link href="/oportunidades/nueva" className="btn">+ Nueva oportunidad</Link>
      </div>
      <div className="card grid grid-cols-2 gap-2 md:grid-cols-5">
        <input className="inp col-span-2" placeholder="Buscar proyecto, ciudad, constructora…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="inp" value={prio} onChange={(e) => setPrio(e.target.value)}>
          <option value="">Todas las prioridades</option>{PRIORIDADES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="inp" value={etapa} onChange={(e) => setEtapa(e.target.value)}>
          <option value="activas">Activas</option><option value="">Todas</option>
          {ETAPAS.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}
        </select>
        <select className="inp" value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">Cualquier responsable</option>{usuarios.map((u) => <option key={u.user_id} value={u.user_id}>{u.nombre}</option>)}
        </select>
        <select className="inp" value={orden} onChange={(e) => setOrden(e.target.value as any)}>
          <option value="prio">Orden: prioridad</option><option value="potencial">Orden: potencial</option><option value="accion">Orden: próxima acción</option>
        </select>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px]">
          <thead><tr>
            <th className="th">Código</th><th className="th">Prio.</th><th className="th">Proyecto</th><th className="th">Ciudad</th>
            <th className="th">Constructor</th><th className="th">Etapa</th><th className="th text-right">Potencial</th><th className="th text-right">Ofertado</th>
            <th className="th">Adjudicación</th><th className="th">Próxima acción</th><th className="th">Resp.</th>
          </tr></thead>
          <tbody>
            {lista.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="td whitespace-nowrap"><Link className="text-navy underline" href={`/oportunidades/${o.id}`}>{o.codigo}</Link></td>
                <td className="td"><span className={`badge ${PRIO_COLOR[o.prioridad]}`}>{o.prioridad}</span></td>
                <td className="td"><Link href={`/oportunidades/${o.id}`} className="hover:underline">{o.proyecto}</Link></td>
                <td className="td text-xs">{o.ciudad}</td>
                <td className="td text-xs">{o.constructor}</td>
                <td className="td text-xs">{etapaNombre(o.etapa)}</td>
                <td className="td text-right whitespace-nowrap">{meur(o.potencial_meur)}</td>
                <td className="td text-right whitespace-nowrap">{meur(o.importe_ofertado_meur)}</td>
                <td className="td text-xs">{o.ventana_adjudicacion}</td>
                <td className="td text-xs"><div className="font-semibold">{fecha(o.fecha_proxima_accion)}</div>{o.proxima_accion}</td>
                <td className="td text-xs">{nombre(o.responsable_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
