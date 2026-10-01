"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { TIPOS_ACT, DURACIONES, horas } from "@/lib/constantes";
import Buscador from "@/components/Buscador";

const hoyLocal = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const horaAhora = () => new Date().toTimeString().slice(0, 5);
const NUEVO = { nombre: "", cargo: "", email: "", telefono: "", empresa_id: "" };

type Props = {
  actividad?: any;            // si viene, se edita
  oportunidadId?: string;     // obra fijada (ficha de oportunidad)
  empresaId?: string | null;  // empresa fijada (ficha de empresa)
  fecha?: string;             // fecha por defecto (diario)
  onHecho?: () => void;
};

/** Registro de una actividad del diario: tipo, fecha/hora, tiempo invertido, empresa, obra, personas y contactos nuevos. */
export default function DiarioForm({ actividad, oportunidadId, empresaId, fecha, onHecho }: Props) {
  const router = useRouter();
  const ed = actividad;
  const [cat, setCat] = useState<{ empresas: any[]; opps: any[]; contactos: any[] }>({ empresas: [], opps: [], contactos: [] });
  const [tipo, setTipo] = useState(ed?.tipo ?? "llamada");
  const [dia, setDia] = useState(ed ? new Date(ed.fecha).toLocaleDateString("sv-SE") : fecha ?? hoyLocal());
  const [hora, setHora] = useState(ed?.hora_inicio?.slice(0, 5) ?? (ed ? new Date(ed.fecha).toTimeString().slice(0, 5) : horaAhora()));
  const [dur, setDur] = useState<number | "">(ed?.duracion_min ?? 30);
  const [oppId, setOppId] = useState(ed?.oportunidad_id ?? oportunidadId ?? "");
  const [empId, setEmpId] = useState(ed?.empresa_id ?? empresaId ?? "");
  const [personas, setPersonas] = useState<string[]>([]);
  const [nuevos, setNuevos] = useState<typeof NUEVO[]>([]);
  const [resumen, setResumen] = useState(ed?.resumen ?? "");
  const [sig, setSig] = useState(ed?.siguiente_paso ?? "");
  const [fsig, setFsig] = useState(ed?.fecha_siguiente ?? "");
  const [actOpp, setActOpp] = useState(true);
  const [foto, setFoto] = useState<File | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    Promise.all([
      sb.from("crm_empresas").select("id,nombre,tipo").order("nombre"),
      sb.from("crm_oportunidades").select("id,codigo,proyecto,ciudad,empresa_id,promotor_id,etapa").order("codigo"),
      sb.from("crm_contactos").select("id,nombre,cargo,empresa_id").order("nombre"),
      ed ? sb.from("crm_actividad_contactos").select("contacto_id").eq("actividad_id", ed.id) : Promise.resolve({ data: [] as any[] }),
    ]).then(([e, o, c, ac]) => {
      setCat({ empresas: e.data ?? [], opps: o.data ?? [], contactos: c.data ?? [] });
      const ids = (ac.data ?? []).map((x: any) => x.contacto_id);
      if (ed) setPersonas(ids.length ? ids : ed.contacto_id ? [ed.contacto_id] : []);
    });
  }, [ed]);

  const opp = cat.opps.find((o) => o.id === oppId);
  const empNombre = (id: string) => cat.empresas.find((e) => e.id === id)?.nombre ?? "";
  // Al elegir obra, proponer su empresa si no hay ninguna
  useEffect(() => { if (opp && !empId) setEmpId(opp.empresa_id ?? opp.promotor_id ?? ""); }, [opp]); // eslint-disable-line react-hooks/exhaustive-deps

  const empresasRel = useMemo(() => new Set([empId, opp?.empresa_id, opp?.promotor_id].filter(Boolean)), [empId, opp]);
  const sugeridos = cat.contactos.filter((c) => empresasRel.has(c.empresa_id));
  const otrosSel = cat.contactos.filter((c) => personas.includes(c.id) && !empresasRel.has(c.empresa_id));
  const itemsOpp = cat.opps.filter((o) => !["X", "Z"].includes(o.etapa) || o.id === oppId).map((o) => ({ id: o.id, t: `${o.codigo} · ${o.proyecto}`, s: o.ciudad }));
  const itemsEmp = cat.empresas.map((e) => ({ id: e.id, t: e.nombre, s: e.tipo }));
  const itemsCon = cat.contactos.filter((c) => !personas.includes(c.id)).map((c) => ({ id: c.id, t: c.nombre, s: [c.cargo, empNombre(c.empresa_id)].filter(Boolean).join(" · ") }));
  const toggle = (id: string) => setPersonas((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!resumen.trim()) return setEstado("Describe brevemente la actividad.");
    if (dur === "" || Number(dur) <= 0) return setEstado("Indica el tiempo invertido.");
    setGuardando(true); setEstado("Guardando…");
    const sb = supabaseBrowser();
    try {
      let foto_path: string | null = ed?.foto_path ?? null;
      if (foto) {
        const ext = foto.name.split(".").pop() || "jpg";
        foto_path = `${dia}/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from("crm-fotos").upload(foto_path, foto, { contentType: foto.type });
        if (error) throw new Error("Foto: " + error.message);
      }
      // 1. Contactos nuevos
      const creados: string[] = [];
      for (const n of nuevos.filter((x) => x.nombre.trim())) {
        const { data, error } = await sb.from("crm_contactos").insert({
          nombre: n.nombre.trim(), cargo: n.cargo || null, email: n.email || null, telefono: n.telefono || null,
          empresa_id: n.empresa_id || empId || null, notas: `Alta desde el diario (${dia}).`,
        }).select("id").single();
        if (error) throw new Error("Contacto: " + error.message);
        creados.push(data.id);
      }
      const todos = [...personas, ...creados];
      // 2. Actividad
      const fila = {
        tipo, fecha: new Date(`${dia}T${hora || "09:00"}:00`).toISOString(), hora_inicio: hora || null, duracion_min: Number(dur),
        oportunidad_id: oppId || null, empresa_id: empId || null, contacto_id: todos[0] ?? null,
        nuevo_contacto: creados.length > 0, resumen: resumen.trim(), siguiente_paso: sig || null, fecha_siguiente: fsig || null, foto_path,
      };
      let actId = ed?.id;
      if (ed) {
        const { error } = await sb.from("crm_actividades").update(fila).eq("id", ed.id);
        if (error) throw new Error(error.message);
        await sb.from("crm_actividad_contactos").delete().eq("actividad_id", ed.id);
      } else {
        const { data, error } = await sb.from("crm_actividades").insert(fila).select("id").single();
        if (error) throw new Error(error.message);
        actId = data.id;
      }
      // 3. Personas de la actividad
      if (todos.length) {
        const { error } = await sb.from("crm_actividad_contactos").insert(todos.map((c) => ({ actividad_id: actId, contacto_id: c, nuevo: creados.includes(c) })));
        if (error) throw new Error("Personas: " + error.message);
      }
      // 4. Obra: último contacto y próxima acción
      if (oppId) {
        const upd: Record<string, any> = {};
        if (TIPOS_ACT.find((t) => t.v === tipo)?.externo) upd.fecha_ultimo_contacto = dia;
        if (actOpp && (sig || fsig)) { upd.proxima_accion = sig || null; upd.fecha_proxima_accion = fsig || null; }
        if (Object.keys(upd).length) await sb.from("crm_oportunidades").update(upd).eq("id", oppId);
      }
      setEstado(ed ? "Cambios guardados ✔" : "Registrado ✔");
      if (!ed) {
        setResumen(""); setSig(""); setFsig(""); setFoto(null); setPersonas([]); setNuevos([]); setHora(horaAhora());
        if (!oportunidadId) setOppId(""); if (!empresaId) setEmpId("");
      }
      onHecho?.();
      router.refresh();
    } catch (err: any) {
      setEstado("Error: " + err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="card space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="col-span-2"><label className="lbl">Tipo de actividad</label>
          <select className="inp" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_ACT.map((t) => <option key={t.v} value={t.v}>{t.n}</option>)}
          </select></div>
        <div><label className="lbl">Fecha</label><input type="date" className="inp" value={dia} onChange={(e) => setDia(e.target.value)} required /></div>
        <div><label className="lbl">Hora inicio</label><input type="time" className="inp" value={hora} onChange={(e) => setHora(e.target.value)} /></div>
      </div>

      <div>
        <label className="lbl">Tiempo invertido {dur !== "" && <span className="font-normal text-slate-500">({horas(Number(dur))})</span>}</label>
        <div className="flex flex-wrap items-center gap-1">
          {DURACIONES.map((m) => (
            <button type="button" key={m} onClick={() => setDur(m)}
              className={`rounded border px-2 py-1 text-xs ${dur === m ? "border-navy bg-navy text-white" : "bg-white hover:bg-slate-100"}`}>{horas(m)}</button>
          ))}
          <input type="number" min={1} max={1440} className="inp w-24" value={dur} onChange={(e) => setDur(e.target.value === "" ? "" : Number(e.target.value))} aria-label="Minutos" />
          <span className="text-xs text-slate-500">min</span>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {oportunidadId ? <div><label className="lbl">Proyecto</label><div className="text-sm">{opp ? `${opp.codigo} · ${opp.proyecto}` : "…"}</div></div>
          : <Buscador etiqueta="Proyecto asociado (opcional)" items={itemsOpp} value={oppId} onChange={setOppId} placeholder="Buscar obra por código, nombre o ciudad…" />}
        <Buscador etiqueta="Empresa relacionada" items={itemsEmp} value={empId} onChange={setEmpId} placeholder="Buscar empresa…" />
      </div>

      <div>
        <label className="lbl">Con quién has hablado / te has reunido</label>
        {sugeridos.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            {sugeridos.map((c) => (
              <button type="button" key={c.id} onClick={() => toggle(c.id)}
                className={`rounded-full border px-2 py-0.5 text-xs ${personas.includes(c.id) ? "border-navy bg-navy text-white" : "bg-white hover:bg-slate-100"}`}>
                {personas.includes(c.id) ? "✓ " : ""}{c.nombre}{c.cargo ? ` · ${c.cargo}` : ""}
              </button>
            ))}
          </div>
        )}
        {otrosSel.map((c) => (
          <span key={c.id} className="mb-1 mr-1 inline-flex items-center gap-1 rounded-full border border-navy bg-navy px-2 py-0.5 text-xs text-white">
            {c.nombre} <button type="button" onClick={() => toggle(c.id)} aria-label="Quitar">✕</button>
          </span>
        ))}
        <Buscador items={itemsCon} value="" onChange={(id) => id && toggle(id)} placeholder="Añadir otra persona ya registrada…" />
        {nuevos.map((n, i) => (
          <div key={i} className="mt-2 grid gap-1 rounded border border-green-300 bg-green-50 p-2 md:grid-cols-5">
            <input className="inp" placeholder="Nombre *" value={n.nombre} onChange={(e) => setNuevos(nuevos.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))} />
            <input className="inp" placeholder="Cargo" value={n.cargo} onChange={(e) => setNuevos(nuevos.map((x, j) => (j === i ? { ...x, cargo: e.target.value } : x)))} />
            <input className="inp" placeholder="Email" type="email" value={n.email} onChange={(e) => setNuevos(nuevos.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} />
            <input className="inp" placeholder="Teléfono" value={n.telefono} onChange={(e) => setNuevos(nuevos.map((x, j) => (j === i ? { ...x, telefono: e.target.value } : x)))} />
            <div className="flex gap-1">
              <select className="inp" value={n.empresa_id || empId} onChange={(e) => setNuevos(nuevos.map((x, j) => (j === i ? { ...x, empresa_id: e.target.value } : x)))}>
                <option value="">Empresa…</option>{cat.empresas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </select>
              <button type="button" className="text-xs text-slate-500" onClick={() => setNuevos(nuevos.filter((_, j) => j !== i))} aria-label="Quitar">✕</button>
            </div>
          </div>
        ))}
        {!ed && <button type="button" className="btn-sec mt-2 text-xs" onClick={() => setNuevos([...nuevos, { ...NUEVO }])}>+ Contacto nuevo</button>}
      </div>

      <div><label className="lbl">Qué se ha hecho / tratado</label>
        <textarea required rows={3} className="inp" value={resumen} onChange={(e) => setResumen(e.target.value)} placeholder="Temas tratados, acuerdos, importes, documentación…" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="lbl">Siguiente paso</label><input className="inp" value={sig} onChange={(e) => setSig(e.target.value)} /></div>
        <div><label className="lbl">Fecha siguiente paso</label><input type="date" className="inp" value={fsig ?? ""} onChange={(e) => setFsig(e.target.value)} /></div>
      </div>
      {oppId && (sig || fsig) && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={actOpp} onChange={(e) => setActOpp(e.target.checked)} /> Actualizar la próxima acción del proyecto</label>}
      <div><label className="lbl">Foto (opcional)</label><input type="file" accept="image/*" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} /></div>
      <div className="flex items-center gap-3">
        <button className="btn" disabled={guardando}>{guardando ? "Guardando…" : ed ? "Guardar cambios" : "Registrar actividad"}</button>
        {estado && <span className="text-sm">{estado}</span>}
      </div>
    </form>
  );
}
