"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ETAPAS, etapaNombre, PRIORIDADES, PRIO_COLOR, ESTADOS_SEGUIMIENTO, ESTADOS_DOC, DOC_COLOR } from "@/lib/constantes";
import { meur, fecha, hoyISO } from "@/lib/format";
import { descargarExcel } from "@/lib/excel";

type Inicial = { vencidas?: boolean; origen?: string; seg?: string; doc?: string };

export default function ListaOportunidades({ opps, usuarios, inicial = {} }: { opps: any[]; usuarios: any[]; inicial?: Inicial }) {
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState("");
  const [etapa, setEtapa] = useState(inicial.doc || inicial.seg ? "" : "activas");
  const [resp, setResp] = useState("");
  const [seg, setSeg] = useState(inicial.seg ?? "");
  const [doc, setDoc] = useState(inicial.doc ?? "");
  const [origen, setOrigen] = useState(inicial.origen ?? "");
  const [soloVencidas, setSoloVencidas] = useState(!!inicial.vencidas);
  const [orden, setOrden] = useState<"prio" | "potencial" | "accion" | "contacto" | "creada">(inicial.vencidas ? "accion" : "prio");
  const hoy = hoyISO();
  const origenes = useMemo(() => [...new Set(opps.map((o) => o.origen).filter(Boolean))].sort(), [opps]);
  const cerrada = (o: any) => ["9", "X", "Z"].includes(o.etapa);
  const vencida = (o: any) => !cerrada(o) && o.fecha_proxima_accion && o.fecha_proxima_accion <= hoy;

  const lista = useMemo(() => {
    const t = q.toLowerCase();
    let l = opps.filter((o) =>
      (!t || [o.codigo, o.proyecto, o.ciudad, o.direccion, o.constructor, o.promotor, o.tipo_activo, o.contacto_objetivo].join(" ").toLowerCase().includes(t)) &&
      (!prio || o.prioridad === prio) &&
      (!resp || o.responsable_id === resp) &&
      (!seg || o.estado_seguimiento === seg) &&
      (!doc || o.estado_documentacion === doc) &&
      (!origen || o.origen === origen) &&
      (!soloVencidas || vencida(o)) &&
      (etapa === "" || (etapa === "activas" ? !cerrada(o) : o.etapa === etapa)));
    const po = (p: string) => PRIORIDADES.indexOf(p);
    l = [...l].sort((a, b) =>
      orden === "prio" ? po(a.prioridad) - po(b.prioridad) || Number(b.potencial_meur ?? 0) - Number(a.potencial_meur ?? 0)
      : orden === "potencial" ? Number(b.potencial_meur ?? 0) - Number(a.potencial_meur ?? 0)
      : orden === "creada" ? String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
      : orden === "contacto" ? String(b.fecha_ultimo_contacto ?? "").localeCompare(String(a.fecha_ultimo_contacto ?? ""))
      : String(a.fecha_proxima_accion ?? "9999").localeCompare(String(b.fecha_proxima_accion ?? "9999")));
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opps, q, prio, etapa, resp, seg, doc, origen, soloVencidas, orden]);
  const total = lista.reduce((s, o) => s + Number(o.potencial_meur ?? 0), 0);
  const nVencidas = opps.filter(vencida).length;
  const nombre = (id: string) => usuarios.find((u) => u.user_id === id)?.nombre ?? "—";
  const [exportando, setExportando] = useState(false);
  async function exportar() {
    setExportando(true);
    try {
      await descargarExcel(`oportunidades_${hoy}`, [{
        nombre: "Oportunidades",
        titulo: `Oportunidades (${lista.length}) · exportado el ${new Date().toLocaleString("es-ES")}`,
        columnas: [
          { h: "Código", k: "codigo", w: 10 }, { h: "Creada", k: "created_at", tipo: "fecha", w: 12 }, { h: "Prioridad", k: "prioridad", w: 9 },
          { h: "Obra", k: "proyecto", w: 45 }, { h: "Ciudad", k: "ciudad", w: 16 }, { h: "Dirección", k: "direccion", w: 30 },
          { h: "Tipo de activo", k: "tipo_activo", w: 18 }, { h: "Constructora", k: "constructor", w: 30 }, { h: "Promotor", k: "promotor", w: 30 },
          { h: "Contacto", k: "contacto_objetivo", w: 30 }, { h: "Etapa", k: "etapa_n", w: 20 }, { h: "Seguimiento", k: "estado_seguimiento", w: 22 },
          { h: "Documentación", k: "estado_documentacion", w: 13 }, { h: "Último contacto", k: "fecha_ultimo_contacto", tipo: "fecha", w: 13 },
          { h: "Potencial (M€)", k: "potencial_meur", tipo: "meur", w: 12 }, { h: "Ofertado (M€)", k: "importe_ofertado_meur", tipo: "meur", w: 12 },
          { h: "Próxima acción (fecha)", k: "fecha_proxima_accion", tipo: "fecha", w: 13 }, { h: "Vencida", k: "vencida_txt", w: 8 },
          { h: "Próxima acción", k: "proxima_accion", w: 40 }, { h: "Responsable", k: "resp_n", w: 18 }, { h: "Gestionado por", k: "gestionado_por", w: 18 },
          { h: "Origen", k: "origen", w: 24 },
        ],
        filas: lista.map((o) => ({ ...o, etapa_n: etapaNombre(o.etapa), resp_n: o.responsable_id ? nombre(o.responsable_id) : "", vencida_txt: vencida(o) ? "Sí" : "" })),
      }]);
    } catch (e: any) { alert("No se pudo generar el Excel: " + e.message); }
    setExportando(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <h1 className="mr-auto text-lg font-bold text-navy">Oportunidades ({lista.length}) · potencial {meur(total, 1)}</h1>
        <button className={soloVencidas ? "btn" : "btn-sec"} onClick={() => { setSoloVencidas(!soloVencidas); setOrden("accion"); }}>
          Seguimientos vencidos ({nVencidas})
        </button>
        <button className="btn-sec" onClick={exportar} disabled={exportando || !lista.length}>{exportando ? "Generando…" : "Exportar a Excel"}</button>
        <Link href="/oportunidades/nueva" className="btn">+ Nueva oportunidad</Link>
      </div>
      <div className="card grid grid-cols-2 gap-2 md:grid-cols-5">
        <input className="inp col-span-2" placeholder="Buscar obra, ciudad, dirección, constructora, promotor, contacto…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="inp" value={prio} onChange={(e) => setPrio(e.target.value)}>
          <option value="">Todas las prioridades</option>{PRIORIDADES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="inp" value={etapa} onChange={(e) => setEtapa(e.target.value)}>
          <option value="activas">Activas (sin cerradas)</option><option value="">Todas</option>
          {ETAPAS.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}
        </select>
        <select className="inp" value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">Cualquier responsable</option>{usuarios.map((u) => <option key={u.user_id} value={u.user_id}>{u.nombre}</option>)}
        </select>
        <select className="inp" value={seg} onChange={(e) => setSeg(e.target.value)}>
          <option value="">Cualquier seguimiento</option>{ESTADOS_SEGUIMIENTO.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="inp" value={doc} onChange={(e) => setDoc(e.target.value)}>
          <option value="">Cualquier documentación</option>{ESTADOS_DOC.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="inp" value={origen} onChange={(e) => setOrigen(e.target.value)}>
          <option value="">Cualquier origen</option>{origenes.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="inp" value={orden} onChange={(e) => setOrden(e.target.value as any)}>
          <option value="prio">Orden: prioridad</option><option value="potencial">Orden: potencial</option>
          <option value="accion">Orden: próxima acción</option><option value="contacto">Orden: último contacto</option><option value="creada">Orden: más recientes</option>
        </select>
        <button className="btn-sec" onClick={() => { setQ(""); setPrio(""); setEtapa("activas"); setResp(""); setSeg(""); setDoc(""); setOrigen(""); setSoloVencidas(false); setOrden("prio"); }}>Limpiar filtros</button>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[1100px]">
          <thead><tr>
            <th className="th">Código</th><th className="th">Creada</th><th className="th">Prio.</th><th className="th">Obra</th><th className="th">Ciudad</th>
            <th className="th">Constructora / promotor</th><th className="th">Etapa</th><th className="th">Seguimiento</th><th className="th">Doc.</th>
            <th className="th">Últ. contacto</th><th className="th text-right">Potencial</th><th className="th">Próxima acción</th><th className="th">Resp.</th>
          </tr></thead>
          <tbody>
            {lista.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="td whitespace-nowrap"><Link className="text-navy underline" href={`/oportunidades/${o.id}`}>{o.codigo}</Link></td>
                <td className="td text-xs whitespace-nowrap">{fecha(o.created_at)}</td>
                <td className="td"><span className={`badge ${PRIO_COLOR[o.prioridad]}`}>{o.prioridad}</span></td>
                <td className="td"><Link href={`/oportunidades/${o.id}`} className="hover:underline">{o.proyecto}</Link>
                  {o.contacto_objetivo && <div className="text-xs text-slate-500">{o.contacto_objetivo}</div>}</td>
                <td className="td text-xs">{o.ciudad}</td>
                <td className="td text-xs">{o.constructor ?? "—"}{o.promotor && <div className="text-slate-500">Prom.: {o.promotor}</div>}</td>
                <td className="td text-xs">{etapaNombre(o.etapa)}</td>
                <td className="td text-xs">{o.estado_seguimiento ?? "—"}{o.gestionado_por && <div className="text-slate-500">{o.gestionado_por}</div>}</td>
                <td className="td text-xs">{o.estado_documentacion ? <span className={`badge ${DOC_COLOR[o.estado_documentacion] ?? ""}`}>{o.estado_documentacion}</span> : "—"}</td>
                <td className="td text-xs whitespace-nowrap">{fecha(o.fecha_ultimo_contacto)}</td>
                <td className="td text-right whitespace-nowrap">{meur(o.potencial_meur)}</td>
                <td className="td text-xs"><div className={`font-semibold ${vencida(o) ? "text-red-600" : ""}`}>{fecha(o.fecha_proxima_accion)}{vencida(o) && " · vencida"}</div>{o.proxima_accion}</td>
                <td className="td text-xs">{nombre(o.responsable_id)}</td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td className="td" colSpan={13}>Ninguna oportunidad con estos filtros.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
