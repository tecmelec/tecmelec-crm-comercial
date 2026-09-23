"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { TIPOS_ACT } from "@/lib/constantes";

/** Registro rápido de actividad. Si no se pasa oportunidadId muestra un buscador de oportunidades. */
export default function ActividadForm({ oportunidadId, empresaId, opps, contactos = [] }: { oportunidadId?: string; empresaId?: string | null; opps?: any[]; contactos?: any[] }) {
  const router = useRouter();
  const [oppId, setOppId] = useState(oportunidadId ?? "");
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("llamada");
  const [resumen, setResumen] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [contactoId, setContactoId] = useState("");
  const [sig, setSig] = useState("");
  const [fsig, setFsig] = useState("");
  const [actualizarOpp, setActualizarOpp] = useState(true);
  const [foto, setFoto] = useState<File | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const filtradas = (opps ?? []).filter((o) => !q || (o.codigo + " " + o.proyecto).toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("Guardando…");
    const sb = supabaseBrowser();
    let foto_path: string | null = null;
    if (foto) {
      const ext = foto.name.split(".").pop() || "jpg";
      foto_path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("crm-fotos").upload(foto_path, foto, { contentType: foto.type });
      if (error) { setEstado("Error subiendo foto: " + error.message); return; }
    }
    const opp = (opps ?? []).find((o) => o.id === oppId);
    const { error } = await sb.from("crm_actividades").insert({
      oportunidad_id: oppId || null, empresa_id: empresaId ?? opp?.empresa_id ?? null, contacto_id: contactoId || null,
      tipo, resumen, nuevo_contacto: nuevo, siguiente_paso: sig || null, fecha_siguiente: fsig || null, foto_path,
    });
    if (error) { setEstado("Error: " + error.message); return; }
    if (oppId && actualizarOpp && (sig || fsig)) {
      await sb.from("crm_oportunidades").update({ proxima_accion: sig || null, fecha_proxima_accion: fsig || null }).eq("id", oppId);
    }
    setResumen(""); setSig(""); setFsig(""); setNuevo(false); setFoto(null); setContactoId("");
    setEstado("Registrado ✔");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="card space-y-3">
      {!oportunidadId && (
        <div>
          <label className="lbl">Oportunidad (opcional)</label>
          <input className="inp" placeholder="Buscar por código o proyecto…" value={q} onChange={(e) => { setQ(e.target.value); setOppId(""); }} />
          {q && !oppId && (
            <div className="mt-1 max-h-48 overflow-auto rounded border bg-white">
              {filtradas.map((o) => (
                <button type="button" key={o.id} className="block w-full px-2 py-1 text-left text-sm hover:bg-slate-100" onClick={() => { setOppId(o.id); setQ(`${o.codigo} · ${o.proyecto}`); }}>
                  {o.codigo} · {o.proyecto}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div><label className="lbl">Tipo</label><select className="inp" value={tipo} onChange={(e) => setTipo(e.target.value)}>{TIPOS_ACT.map((t) => <option key={t.v} value={t.v}>{t.n}</option>)}</select></div>
        {contactos.length > 0 && (
          <div><label className="lbl">Contacto</label><select className="inp" value={contactoId} onChange={(e) => setContactoId(e.target.value)}><option value="">—</option>{contactos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
        )}
      </div>
      <div><label className="lbl">Qué ha pasado</label><textarea required rows={3} className="inp" value={resumen} onChange={(e) => setResumen(e.target.value)} placeholder="Con quién hablaste, qué dijo, qué obra, importes, fechas…" /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={nuevo} onChange={(e) => setNuevo(e.target.checked)} /> Es un contacto nuevo con un decisor (cuenta para el KPI)</label>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="lbl">Siguiente paso</label><input className="inp" value={sig} onChange={(e) => setSig(e.target.value)} /></div>
        <div><label className="lbl">Fecha</label><input type="date" className="inp" value={fsig} onChange={(e) => setFsig(e.target.value)} /></div>
      </div>
      {oppId && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={actualizarOpp} onChange={(e) => setActualizarOpp(e.target.checked)} /> Actualizar la próxima acción de la oportunidad</label>}
      <div><label className="lbl">Foto (cartel de obra, pizarra…)</label><input type="file" accept="image/*" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} /></div>
      <div className="flex items-center gap-3"><button className="btn">Registrar</button>{estado && <span className="text-sm">{estado}</span>}</div>
    </form>
  );
}
