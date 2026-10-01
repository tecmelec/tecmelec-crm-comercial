import Link from "next/link";
import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import ResumenTiempos from "@/components/ResumenTiempos";
import ExportarInforme from "@/components/ExportarInforme";
import { SELECT_ACT } from "@/lib/diario";
import { GRUPOS_ACT, GRUPO_COLOR, TIPOS_ACT, tipoNombre, horas } from "@/lib/constantes";
import { hoyMadrid, inicioDia, sumarDias, esDia, diaDe, horaDe, fechaLarga } from "@/lib/tz";

export const dynamic = "force-dynamic";

const grupo = (t: string) => TIPOS_ACT.find((x) => x.v === t)?.g ?? "Trabajo interno";
const minutos = (l: any[]) => l.reduce((s, a) => s + Number(a.duracion_min ?? 0), 0);

export default async function Page({ searchParams }: { searchParams: { desde?: string; hasta?: string; u?: string } }) {
  const { sb, user, perfil } = await getSesion();
  if (!perfil || !user) return <SinAcceso />;
  const esAdmin = ["admin", "direccion"].includes(perfil.rol);
  const hoy = hoyMadrid();
  const desde = esDia(searchParams.desde) ? searchParams.desde! : hoy;
  let hasta = esDia(searchParams.hasta) ? searchParams.hasta! : desde;
  if (hasta < desde) hasta = desde;
  if (hasta > sumarDias(desde, 92)) hasta = sumarDias(desde, 92);
  const uSel = esAdmin ? searchParams.u ?? "" : user.id;

  let q = sb.from("crm_actividades").select(SELECT_ACT)
    .gte("fecha", inicioDia(desde).toISOString()).lt("fecha", inicioDia(sumarDias(hasta, 1)).toISOString())
    .not("usuario_id", "is", null).order("fecha");
  if (uSel) q = q.eq("usuario_id", uSel);
  const [{ data }, { data: usuarios }] = await Promise.all([q, sb.from("crm_usuarios").select("user_id,nombre,rol,activo").order("nombre")]);
  const acts = data ?? [];
  const nombre = (id: string) => usuarios?.find((u) => u.user_id === id)?.nombre ?? "—";
  const porUsuario = [...new Set(acts.map((a) => a.usuario_id))].map((id) => ({ id, l: acts.filter((a) => a.usuario_id === id) }))
    .sort((a, b) => nombre(a.id).localeCompare(nombre(b.id)));
  const porTipo = TIPOS_ACT.map((t) => ({ ...t, l: acts.filter((a) => a.tipo === t.v) })).filter((t) => t.l.length);
  const ranking = (clave: "oportunidad" | "empresa") => {
    const m = new Map<string, { t: string; href: string; min: number; n: number }>();
    acts.forEach((a) => {
      const x = a[clave]; if (!x) return;
      const r = m.get(x.id) ?? { t: clave === "oportunidad" ? `${x.codigo} ${x.proyecto}` : x.nombre, href: `/${clave === "oportunidad" ? "oportunidades" : "empresas"}/${x.id}`, min: 0, n: 0 };
      r.min += Number(a.duracion_min ?? 0); r.n++; m.set(x.id, r);
    });
    return [...m.values()].sort((a, b) => b.min - a.min || b.n - a.n).slice(0, 10);
  };
  const periodo = desde === hasta ? fechaLarga(desde) : `del ${fechaLarga(desde)} al ${fechaLarga(hasta)}`;
  const filasCsv = acts.map((a) => ({
    Fecha: diaDe(a.fecha), Hora: horaDe(a.fecha), Usuario: nombre(a.usuario_id), Tipo: tipoNombre(a.tipo), Grupo: grupo(a.tipo),
    "Minutos": a.duracion_min ?? "", "Horas": a.duracion_min ? (a.duracion_min / 60).toFixed(2).replace(".", ",") : "",
    Empresa: a.empresa?.nombre ?? "", Proyecto: a.oportunidad ? `${a.oportunidad.codigo} ${a.oportunidad.proyecto}` : "",
    Personas: (a.personas ?? []).map((p: any) => p.contacto?.nombre + (p.nuevo ? " (nuevo)" : "")).join(", "),
    "Contactos nuevos": (a.personas ?? []).filter((p: any) => p.nuevo).length, Resumen: a.resumen, "Siguiente paso": a.siguiente_paso ?? "", "Fecha siguiente": a.fecha_siguiente ?? "",
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="mr-auto">
          <h1 className="text-lg font-bold text-navy">Informe de actividad {uSel ? `· ${nombre(uSel)}` : "· todo el equipo"}</h1>
          <p className="text-sm capitalize text-slate-600">{periodo}</p>
        </div>
        <ExportarInforme filas={filasCsv} nombre={`actividad_${desde}${hasta !== desde ? "_" + hasta : ""}${uSel ? "_" + nombre(uSel).replace(/\s+/g, "_") : ""}`} />
      </div>
      <form className="no-print card flex flex-wrap items-end gap-2" action="/informes">
        <div><label className="lbl">Desde</label><input type="date" name="desde" defaultValue={desde} className="inp" /></div>
        <div><label className="lbl">Hasta</label><input type="date" name="hasta" defaultValue={hasta} className="inp" /></div>
        {esAdmin && (
          <div><label className="lbl">Usuario</label>
            <select name="u" defaultValue={uSel} className="inp"><option value="">Todo el equipo</option>
              {(usuarios ?? []).map((u) => <option key={u.user_id} value={u.user_id}>{u.nombre}</option>)}</select></div>
        )}
        <button className="btn">Ver informe</button>
        <span className="flex gap-2 text-sm">
          <Link className="underline" href={`/informes?desde=${hoy}&hasta=${hoy}${uSel && esAdmin ? `&u=${uSel}` : ""}`}>Hoy</Link>
          <Link className="underline" href={`/informes?desde=${sumarDias(hoy, -1)}&hasta=${sumarDias(hoy, -1)}${uSel && esAdmin ? `&u=${uSel}` : ""}`}>Ayer</Link>
          <Link className="underline" href={`/informes?desde=${sumarDias(hoy, -6)}&hasta=${hoy}${uSel && esAdmin ? `&u=${uSel}` : ""}`}>Últimos 7 días</Link>
          <Link className="underline" href={`/informes?desde=${hoy.slice(0, 8)}01&hasta=${hoy}${uSel && esAdmin ? `&u=${uSel}` : ""}`}>Este mes</Link>
        </span>
      </form>

      <div className="card"><h2 className="mb-2 font-bold text-navy">Resumen general</h2><ResumenTiempos acts={acts} /></div>

      {acts.length === 0 ? <div className="card text-sm text-slate-500">No hay actividades registradas en este periodo.</div> : (<>
        {!uSel && (
          <div className="card overflow-x-auto p-0">
            <h2 className="p-3 font-bold text-navy">Por usuario</h2>
            <table className="w-full min-w-[800px]">
              <thead><tr><th className="th">Usuario</th><th className="th text-right">Activ.</th><th className="th text-right">Tiempo</th>
                {GRUPOS_ACT.map((g) => <th key={g} className="th text-right"><span style={{ color: GRUPO_COLOR[g] }}>■</span> {g}</th>)}
                <th className="th text-right">Personas</th><th className="th text-right">Nuevos</th></tr></thead>
              <tbody>{porUsuario.map(({ id, l }) => (
                <tr key={id}>
                  <td className="td"><Link className="text-navy underline" href={`/informes?desde=${desde}&hasta=${hasta}&u=${id}`}>{nombre(id)}</Link></td>
                  <td className="td text-right">{l.length}</td><td className="td text-right font-semibold">{horas(minutos(l))}</td>
                  {GRUPOS_ACT.map((g) => { const x = l.filter((a) => grupo(a.tipo) === g); return <td key={g} className="td text-right text-xs">{x.length ? `${horas(minutos(x))} (${x.length})` : "—"}</td>; })}
                  <td className="td text-right">{new Set(l.flatMap((a) => (a.personas ?? []).map((p: any) => p.contacto?.id))).size}</td>
                  <td className="td text-right">{l.reduce((s, a) => s + (a.personas ?? []).filter((p: any) => p.nuevo).length, 0)}</td>
                </tr>))}
                <tr className="font-semibold"><td className="td">Total</td><td className="td text-right">{acts.length}</td><td className="td text-right">{horas(minutos(acts))}</td>
                  {GRUPOS_ACT.map((g) => <td key={g} className="td text-right text-xs">{horas(minutos(acts.filter((a) => grupo(a.tipo) === g)))}</td>)}<td className="td" /><td className="td" /></tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card"><h2 className="mb-2 font-bold text-navy">Por tipo de actividad</h2>
            <table className="w-full"><tbody>{porTipo.map((t) => (
              <tr key={t.v}><td className="td"><span style={{ color: GRUPO_COLOR[t.g] }}>■</span> {t.n}</td><td className="td text-right">{t.l.length}</td><td className="td text-right">{horas(minutos(t.l))}</td></tr>))}</tbody></table></div>
          {(["oportunidad", "empresa"] as const).map((k) => (
            <div key={k} className="card"><h2 className="mb-2 font-bold text-navy">{k === "oportunidad" ? "Proyectos con más dedicación" : "Empresas con más dedicación"}</h2>
              {ranking(k).length === 0 ? <p className="text-sm text-slate-500">Ninguna actividad vinculada.</p> : (
                <table className="w-full"><tbody>{ranking(k).map((r) => (
                  <tr key={r.href}><td className="td"><Link className="text-navy underline" href={r.href}>{r.t}</Link></td><td className="td text-right">{r.n}</td><td className="td whitespace-nowrap text-right">{horas(r.min)}</td></tr>))}</tbody></table>)}
            </div>
          ))}
        </div>

        {porUsuario.map(({ id, l }, i) => (
          <div key={id} className={`card overflow-x-auto p-0 ${i > 0 || !uSel ? "salto" : ""}`}>
            <div className="flex flex-wrap items-baseline gap-2 p-3">
              <h2 className="font-bold text-navy">Detalle · {nombre(id)}</h2>
              <span className="text-sm text-slate-600">{l.length} actividades · {horas(minutos(l))}</span>
            </div>
            <table className="w-full min-w-[900px]">
              <thead><tr><th className="th">Fecha</th><th className="th">Hora</th><th className="th">Tipo</th><th className="th text-right">Tiempo</th><th className="th">Empresa / proyecto</th><th className="th">Personas</th><th className="th">Qué se hizo</th><th className="th">Siguiente paso</th></tr></thead>
              <tbody>{l.map((a) => (
                <tr key={a.id}>
                  <td className="td whitespace-nowrap text-xs">{diaDe(a.fecha).split("-").reverse().join("/")}</td>
                  <td className="td text-xs">{horaDe(a.fecha)}</td>
                  <td className="td text-xs"><span style={{ color: GRUPO_COLOR[grupo(a.tipo)] }}>■</span> {tipoNombre(a.tipo)}</td>
                  <td className="td whitespace-nowrap text-right text-xs">{a.duracion_min ? horas(a.duracion_min) : <span className="text-amber-700">sin tiempo</span>}</td>
                  <td className="td text-xs">{a.empresa?.nombre}{a.oportunidad && <div className="text-slate-500">{a.oportunidad.codigo} {a.oportunidad.proyecto}</div>}</td>
                  <td className="td text-xs">{(a.personas ?? []).map((p: any, j: number) => <div key={j}>{p.contacto?.nombre}{p.contacto?.cargo ? ` · ${p.contacto.cargo}` : ""}{p.nuevo && <b className="text-green-700"> (nuevo)</b>}</div>)}</td>
                  <td className="td whitespace-pre-wrap text-xs">{a.resumen}</td>
                  <td className="td text-xs">{a.siguiente_paso}{a.fecha_siguiente && <div className="text-slate-500">{a.fecha_siguiente.split("-").reverse().join("/")}</div>}</td>
                </tr>))}</tbody>
            </table>
          </div>
        ))}
      </>)}
    </div>
  );
}
