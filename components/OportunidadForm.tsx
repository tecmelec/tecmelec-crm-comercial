"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ETAPAS, PRIORIDADES, GO_NOGO } from "@/lib/constantes";
import { meur } from "@/lib/format";

const CAMPOS_TEXTO: [string, string][] = [
  ["proyecto", "Proyecto"], ["ciudad", "Ciudad"], ["tipo_activo", "Tipo de activo"], ["promotor", "Promotor"],
  ["constructor", "Constructor"], ["ingenieria_pm", "Ingeniería / PM"], ["fase_obra", "Fase de la obra"],
  ["estado_electrico", "Estado del paquete eléctrico"], ["presupuesto_txt", "Presupuesto (texto)"],
  ["ventana_rfq", "Ventana RFQ"], ["ventana_adjudicacion", "Ventana adjudicación"], ["contacto_objetivo", "Contacto objetivo (cargo)"],
  ["empresa_objetivo", "Empresa objetivo"], ["via_entrada", "Vía de entrada"], ["prob_ofertar", "Probabilidad de poder ofertar"],
  ["fuente", "Fuente"], ["url", "URL de la fuente"], ["fecha_info", "Fecha de la información"],
];

export default function OportunidadForm({ opp, empresas, contactos, usuarios, nueva, licitacionId }: { opp: any; empresas: any[]; contactos: any[]; usuarios: any[]; nueva?: boolean; licitacionId?: string }) {
  const router = useRouter();
  const [o, setO] = useState<any>({ go_nogo: {}, etapa: "1", prioridad: "P2", ...opp });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: string, v: any) => setO((x: any) => ({ ...x, [k]: v }));
  const num = (v: string) => (v === "" ? null : Number(String(v).replace(",", ".")));
  const goOk = GO_NOGO.every((g) => o.go_nogo?.[g.k]);
  const etapaNum = Number(o.etapa);
  const avisoGo = !isNaN(etapaNum) && etapaNum >= 5 && !goOk;
  const paquete = Number(o.base_obra_meur ?? 0) * Number(o.pct_electrico ?? 0);
  const potencial = paquete * Number(o.pct_captable ?? 0);

  async function guardar() {
    setGuardando(true); setMsg(null);
    const sb = supabaseBrowser();
    const payload: any = { ...o };
    ["id", "created_at", "updated_at", "paquete_meur", "potencial_meur", "updated_by"].forEach((k) => delete payload[k]);
    ["empresa_id", "contacto_id", "responsable_id", "fecha_proxima_accion", "fecha_est_adjudicacion", "fecha_firma"].forEach((k) => { if (payload[k] === "") payload[k] = null; });
    if (nueva) {
      if (!payload.codigo) {
        const { count } = await sb.from("crm_oportunidades").select("id", { count: "exact", head: true });
        payload.codigo = `OP-${String((count ?? 0) + 1).padStart(3, "0")}`;
      }
      const { data, error } = await sb.from("crm_oportunidades").insert(payload).select("id").single();
      setGuardando(false);
      if (error) return setMsg("Error: " + error.message);
      if (licitacionId) await sb.from("crm_licitaciones").update({ estado: "convertida", oportunidad_id: data.id }).eq("id", licitacionId);
      router.push(`/oportunidades/${data.id}`);
    } else {
      const { error } = await sb.from("crm_oportunidades").update(payload).eq("id", o.id);
      setGuardando(false);
      setMsg(error ? "Error: " + error.message : "Guardado");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-2 gap-3 md:grid-cols-4">
        <div><label className="lbl">Prioridad</label><select className="inp" value={o.prioridad} onChange={(e) => set("prioridad", e.target.value)}>{PRIORIDADES.map((p) => <option key={p}>{p}</option>)}</select></div>
        <div><label className="lbl">Etapa</label><select className="inp" value={o.etapa} onChange={(e) => set("etapa", e.target.value)}>{ETAPAS.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}</select></div>
        <div><label className="lbl">Responsable</label><select className="inp" value={o.responsable_id ?? ""} onChange={(e) => set("responsable_id", e.target.value)}><option value="">—</option>{usuarios.map((u) => <option key={u.user_id} value={u.user_id}>{u.nombre}</option>)}</select></div>
        <div><label className="lbl">Empresa vinculada</label><select className="inp" value={o.empresa_id ?? ""} onChange={(e) => set("empresa_id", e.target.value)}><option value="">—</option>{empresas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></div>
        <div><label className="lbl">Contacto principal</label><select className="inp" value={o.contacto_id ?? ""} onChange={(e) => set("contacto_id", e.target.value)}><option value="">—</option>{contactos.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.cargo ?? "—"})</option>)}</select></div>
        <div><label className="lbl">Próxima acción – fecha</label><input type="date" className="inp" value={o.fecha_proxima_accion ?? ""} onChange={(e) => set("fecha_proxima_accion", e.target.value)} /></div>
        <div className="col-span-2"><label className="lbl">Próxima acción</label><input className="inp" value={o.proxima_accion ?? ""} onChange={(e) => set("proxima_accion", e.target.value)} /></div>
      </div>

      <div className="card grid grid-cols-2 gap-3 md:grid-cols-4">
        <h3 className="col-span-2 font-bold text-navy md:col-span-4">Cifras (M€)</h3>
        <div><label className="lbl">Base obra (M€)</label><input className="inp" value={o.base_obra_meur ?? ""} onChange={(e) => set("base_obra_meur", num(e.target.value))} /></div>
        <div><label className="lbl">% eléctrico (0–1)</label><input className="inp" value={o.pct_electrico ?? ""} onChange={(e) => set("pct_electrico", num(e.target.value))} /></div>
        <div><label className="lbl">% captable (0–1)</label><input className="inp" value={o.pct_captable ?? ""} onChange={(e) => set("pct_captable", num(e.target.value))} /></div>
        <div className="text-sm"><div className="lbl">Paquete / potencial (calc.)</div>{meur(paquete)} / <b>{meur(potencial)}</b></div>
        <div><label className="lbl">Prob. de RFQ (0–1)</label><input className="inp" value={o.prob_rfq ?? ""} onChange={(e) => set("prob_rfq", num(e.target.value))} /></div>
        <div><label className="lbl">Importe ofertado (M€)</label><input className="inp" value={o.importe_ofertado_meur ?? ""} onChange={(e) => set("importe_ofertado_meur", num(e.target.value))} /></div>
        <div><label className="lbl">Prob. adjudicación (0–1)</label><input className="inp" value={o.prob_adjudicacion ?? ""} onChange={(e) => set("prob_adjudicacion", num(e.target.value))} /></div>
        <div><label className="lbl">Fecha est. adjudicación</label><input type="date" className="inp" value={o.fecha_est_adjudicacion ?? ""} onChange={(e) => set("fecha_est_adjudicacion", e.target.value)} /></div>
        <div><label className="lbl">Importe contratado (M€)</label><input className="inp" value={o.importe_contratado_meur ?? ""} onChange={(e) => set("importe_contratado_meur", num(e.target.value))} /></div>
        <div><label className="lbl">Fecha de firma</label><input type="date" className="inp" value={o.fecha_firma ?? ""} onChange={(e) => set("fecha_firma", e.target.value)} /></div>
        <div className="col-span-2"><label className="lbl">Motivo de pérdida / descarte</label><input className="inp" value={o.motivo_perdida ?? ""} onChange={(e) => set("motivo_perdida", e.target.value)} /></div>
      </div>

      <div className={`card ${avisoGo ? "border-red-400" : ""}`}>
        <h3 className="mb-2 font-bold text-navy">Go / No-go (obligatorio antes de «5. En estudio»)</h3>
        {avisoGo && <p className="mb-2 text-sm font-semibold text-red-600">Faltan criterios: no debería estudiarse todavía.</p>}
        <div className="grid gap-1 md:grid-cols-2">
          {GO_NOGO.map((g) => (
            <label key={g.k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!o.go_nogo?.[g.k]} onChange={(e) => set("go_nogo", { ...o.go_nogo, [g.k]: e.target.checked })} /> {g.n}
            </label>
          ))}
        </div>
      </div>

      <div className="card grid grid-cols-1 gap-3 md:grid-cols-2">
        <h3 className="font-bold text-navy md:col-span-2">Datos del proyecto</h3>
        {CAMPOS_TEXTO.map(([k, n]) => (
          <div key={k}><label className="lbl">{n}</label><input className="inp" value={o[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></div>
        ))}
        <div className="md:col-span-2"><label className="lbl">Nota de estimación</label><input className="inp" value={o.nota_estimacion ?? ""} onChange={(e) => set("nota_estimacion", e.target.value)} /></div>
        <div className="md:col-span-2"><label className="lbl">Notas</label><textarea rows={4} className="inp" value={o.notas ?? ""} onChange={(e) => set("notas", e.target.value)} /></div>
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t bg-slate-50 py-2">
        <button className="btn" onClick={guardar} disabled={guardando || !o.proyecto}>{guardando ? "Guardando…" : nueva ? "Crear oportunidad" : "Guardar cambios"}</button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}
