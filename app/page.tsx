import Link from "next/link";
import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import { ETAPAS, etapaNombre, OBJETIVO_MEUR, PRIO_COLOR } from "@/lib/constantes";
import { meur, fecha } from "@/lib/format";
import { inicioSemana, isoDia } from "@/lib/semana";

export const dynamic = "force-dynamic";

const probEtapa = (e: string) => ETAPAS.find((x) => x.v === e)?.p ?? 0;

export default async function Panel() {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const lunes = inicioSemana();
  const hoy = isoDia(new Date());
  const [{ data: opps }, { data: acts }, { data: plan }, { count: licNuevas }, { data: usuarios }] = await Promise.all([
    sb.from("crm_oportunidades").select("id,codigo,proyecto,prioridad,etapa,potencial_meur,importe_ofertado_meur,prob_adjudicacion,importe_contratado_meur,fecha_proxima_accion,proxima_accion,responsable_id,fecha_firma,fecha_est_adjudicacion"),
    sb.from("crm_actividades").select("tipo,nuevo_contacto,usuario_id,fecha").gte("fecha", lunes.toISOString()),
    sb.from("crm_plan_semanal").select("*").lte("inicio", hoy).gte("fin", hoy).maybeSingle(),
    sb.from("crm_licitaciones").select("id", { count: "exact", head: true }).eq("estado", "nueva"),
    sb.from("crm_usuarios").select("user_id,nombre"),
  ]);
  const O = opps ?? [];
  const A = acts ?? [];
  const nombre = (id: string) => usuarios?.find((u) => u.user_id === id)?.nombre ?? "—";

  const contratado = O.filter((o) => o.etapa === "9").reduce((s, o) => s + Number(o.importe_contratado_meur ?? o.importe_ofertado_meur ?? 0), 0);
  const adjudicado = O.filter((o) => o.etapa === "8").reduce((s, o) => s + Number(o.importe_contratado_meur ?? o.importe_ofertado_meur ?? 0), 0);
  const ofertadoVivo = O.filter((o) => ["6", "7"].includes(o.etapa)).reduce((s, o) => s + Number(o.importe_ofertado_meur ?? 0), 0);
  const ponderado = O.filter((o) => !["9", "X", "Z", "0"].includes(o.etapa)).reduce((s, o) => {
    const p = o.prob_adjudicacion ?? probEtapa(o.etapa);
    const base = o.importe_ofertado_meur ?? o.potencial_meur ?? 0;
    return s + Number(base) * Number(p);
  }, 0);
  const avance = Math.min(100, ((contratado + adjudicado) / OBJETIVO_MEUR) * 100);

  const cuenta = (f: (a: any) => boolean) => A.filter(f).length;
  const semana = [
    { k: "Contactos nuevos", real: cuenta((a) => a.nuevo_contacto), obj: plan?.contactos },
    { k: "Reuniones", real: cuenta((a) => a.tipo === "reunion"), obj: plan?.reuniones },
    { k: "Visitas de obra", real: cuenta((a) => a.tipo === "visita"), obj: 2 },
    { k: "RFQ recibidas", real: cuenta((a) => a.tipo === "rfq"), obj: plan?.rfq },
    { k: "Ofertas presentadas", real: cuenta((a) => a.tipo === "oferta"), obj: plan?.ofertas },
    { k: "Llamadas", real: cuenta((a) => a.tipo === "llamada"), obj: 33 },
  ];
  const vencidas = O.filter((o) => o.fecha_proxima_accion && o.fecha_proxima_accion <= hoy && !["9", "X", "Z", "0"].includes(o.etapa))
    .sort((a, b) => (a.fecha_proxima_accion! < b.fecha_proxima_accion! ? -1 : 1));
  const porEtapa = ETAPAS.map((e) => ({ ...e, cnt: O.filter((o) => o.etapa === e.v).length, imp: O.filter((o) => o.etapa === e.v).reduce((s, o) => s + Number(o.importe_ofertado_meur ?? o.potencial_meur ?? 0), 0) }));
  const maxN = Math.max(1, ...porEtapa.map((e) => e.cnt));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi t="Contratado (firmado)" v={meur(contratado, 1)} s={`Objetivo ${OBJETIVO_MEUR} M€ a 31/01/2027`} fuerte />
        <Kpi t="Adjudicado pendiente de firma" v={meur(adjudicado, 1)} />
        <Kpi t="Ofertado vivo (etapas 6–7)" v={meur(ofertadoVivo, 1)} s="Necesario ≈ 100 M€ en el periodo" />
        <Kpi t="Pipeline ponderado" v={meur(ponderado, 1)} s="Importe × probabilidad" />
        <Kpi t="Licitaciones nuevas" v={String(licNuevas ?? 0)} s={<Link className="underline" href="/licitaciones">revisar</Link>} />
      </div>
      <div className="card">
        <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">Avance hacia 20 M€ (firmado + adjudicado)</span><span>{avance.toFixed(0)}%</span></div>
        <div className="h-3 w-full rounded bg-slate-200"><div className="h-3 rounded bg-navy" style={{ width: `${avance}%` }} /></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-bold text-navy">Esta semana {plan ? `(sem. ${plan.semana}: ${plan.objetivo})` : ""}</h2>
          <table className="w-full">
            <thead><tr><th className="th">KPI</th><th className="th">Real</th><th className="th">Objetivo</th></tr></thead>
            <tbody>
              {semana.map((s) => (
                <tr key={s.k}>
                  <td className="td">{s.k}</td>
                  <td className={`td font-semibold ${s.obj != null && s.real < s.obj ? "text-red-600" : "text-green-700"}`}>{s.real}</td>
                  <td className="td">{s.obj ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {plan?.obras && <p className="mt-2 text-xs text-slate-600">Obras a atacar: {plan.obras}</p>}
        </div>
        <div className="card">
          <h2 className="mb-2 font-bold text-navy">Pipeline por etapa</h2>
          {porEtapa.filter((e) => e.cnt > 0).map((e) => (
            <div key={e.v} className="mb-1 flex items-center gap-2 text-sm">
              <span className="w-48 shrink-0">{e.n}</span>
              <div className="h-4 rounded bg-navy/80" style={{ width: `${(e.cnt / maxN) * 50}%` }} />
              <span className="text-xs text-slate-600">{e.cnt} · {meur(e.imp, 1)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2 className="mb-2 font-bold text-navy">Próximas acciones vencidas o de hoy ({vencidas.length})</h2>
        <table className="w-full">
          <thead><tr><th className="th">Fecha</th><th className="th">Prio.</th><th className="th">Oportunidad</th><th className="th">Acción</th><th className="th">Etapa</th><th className="th">Responsable</th></tr></thead>
          <tbody>
            {vencidas.slice(0, 20).map((o) => (
              <tr key={o.id}>
                <td className="td whitespace-nowrap">{fecha(o.fecha_proxima_accion)}</td>
                <td className="td"><span className={`badge ${PRIO_COLOR[o.prioridad]}`}>{o.prioridad}</span></td>
                <td className="td"><Link className="text-navy underline" href={`/oportunidades/${o.id}`}>{o.codigo} · {o.proyecto}</Link></td>
                <td className="td">{o.proxima_accion}</td>
                <td className="td text-xs">{etapaNombre(o.etapa)}</td>
                <td className="td text-xs">{nombre(o.responsable_id)}</td>
              </tr>
            ))}
            {vencidas.length === 0 && <tr><td className="td" colSpan={6}>Nada vencido.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ t, v, s, fuerte }: { t: string; v: string; s?: React.ReactNode; fuerte?: boolean }) {
  return (
    <div className={`card ${fuerte ? "border-navy" : ""}`}>
      <div className="text-xs text-slate-500">{t}</div>
      <div className={`text-xl font-bold ${fuerte ? "text-navy" : ""}`}>{v}</div>
      {s && <div className="text-xs text-slate-500">{s}</div>}
    </div>
  );
}
