import Link from "next/link";
import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import ResumenTiempos from "@/components/ResumenTiempos";
import ExportarInforme from "@/components/ExportarInforme";
import { SELECT_ACT } from "@/lib/diario";
import { GRUPOS_ACT, GRUPO_COLOR, TIPOS_ACT, tipoNombre, horas, etapaNombre } from "@/lib/constantes";
import { meur } from "@/lib/format";
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
  const [{ data }, { data: usuarios }, { data: oppsAll }, { data: adjActs }] = await Promise.all([
    q, sb.from("crm_usuarios").select("user_id,nombre,rol,activo").order("nombre"),
    sb.from("crm_oportunidades").select("id,codigo,proyecto,ciudad,etapa,responsable_id,created_at,fecha_firma,fecha_est_adjudicacion,importe_contratado_meur,importe_ofertado_meur,potencial_meur,constructor"),
    sb.from("crm_actividades").select("oportunidad_id,usuario_id,fecha").eq("tipo", "adjudicacion").not("oportunidad_id", "is", null)
      .gte("fecha", inicioDia(desde).toISOString()).lt("fecha", inicioDia(sumarDias(hasta, 1)).toISOString()),
  ]);
  // ---- Resultados comerciales del periodo
  const enRango = (d?: string | null) => !!d && d >= desde && d <= hasta;
  const O = oppsAll ?? [];
  const deUsuario = (o: any, uid?: string | null) => !uSel || o.responsable_id === uSel || uid === uSel;
  const nuevas = O.filter((o) => enRango(diaDe(o.created_at)) && deUsuario(o));
  const conseguidasMap = new Map<string, any>();
  O.filter((o) => (o.etapa === "9" && enRango(o.fecha_firma)) || (o.etapa === "8" && enRango(o.fecha_est_adjudicacion)))
    .forEach((o) => deUsuario(o) && conseguidasMap.set(o.id, { ...o, por: o.responsable_id, cuando: o.etapa === "9" ? o.fecha_firma : o.fecha_est_adjudicacion }));
  (adjActs ?? []).forEach((a) => {
    const o = O.find((x) => x.id === a.oportunidad_id);
    if (o && ["8", "9"].includes(o.etapa) && !conseguidasMap.has(o.id) && deUsuario(o, a.usuario_id))
      conseguidasMap.set(o.id, { ...o, por: o.responsable_id ?? a.usuario_id, cuando: diaDe(a.fecha) });
  });
  const conseguidas = [...conseguidasMap.values()].sort((a, b) => String(a.cuando).localeCompare(String(b.cuando)));
  const importeOpp = (o: any) => Number(o.importe_contratado_meur ?? o.importe_ofertado_meur ?? 0);
  const totConseguido = conseguidas.reduce((s2, o) => s2 + importeOpp(o), 0);
  const ganadasTotal = O.filter((o) => ["8", "9"].includes(o.etapa) && (!uSel || o.responsable_id === uSel));
  const ofertasPer = (data ?? []).filter((a) => a.tipo === "oferta");
  const resultadosPor = (uid: string) => ({
    nuevas: nuevas.filter((o) => o.responsable_id === uid).length,
    ofertas: ofertasPer.filter((a) => a.usuario_id === uid).length,
    conseguidas: conseguidas.filter((o) => o.por === uid),
  });
  const acts = data ?? [];
  const nombre = (id: string) => usuarios?.find((u) => u.user_id === id)?.nombre ?? "—";
  const porUsuario = [...new Set([...acts.map((a) => a.usuario_id), ...conseguidas.map((o) => o.por), ...nuevas.map((o) => o.responsable_id)].filter((x) => x && (!uSel || x === uSel)))].map((id) => ({ id, l: acts.filter((a) => a.usuario_id === id) }))
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
  const filasAct = acts.map((a) => ({
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
        <ExportarInforme hojas={[
          { nombre: "Actividades", titulo: `Actividad ${uSel ? nombre(uSel) : "equipo"} · ${periodo}`, filas: filasAct,
            columnas: Object.keys(filasAct[0] ?? { Fecha: 1 }).map((k) => ({ h: k, k, w: ["Resumen", "Siguiente paso", "Personas", "Proyecto"].includes(k) ? 40 : k === "Empresa" ? 28 : 14, tipo: k === "Minutos" ? "numero" as const : undefined })) },
          { nombre: "Conseguidas", titulo: `Oportunidades conseguidas · ${periodo}`,
            filas: conseguidas.map((o) => ({ fecha: o.cuando, codigo: o.codigo, proyecto: o.proyecto, ciudad: o.ciudad, constructora: o.constructor, etapa: etapaNombre(o.etapa), importe: importeOpp(o) || null, resp: o.por ? nombre(o.por) : "" })),
            columnas: [{ h: "Fecha", k: "fecha", tipo: "fecha" as const, w: 12 }, { h: "Código", k: "codigo", w: 10 }, { h: "Obra", k: "proyecto", w: 45 }, { h: "Ciudad", k: "ciudad" },
              { h: "Constructora", k: "constructora", w: 30 }, { h: "Etapa", k: "etapa", w: 20 }, { h: "Importe (M€)", k: "importe", tipo: "meur" as const, w: 12 }, { h: "Responsable", k: "resp" }] },
          { nombre: "Nuevas", titulo: `Oportunidades nuevas · ${periodo}`,
            filas: nuevas.map((o) => ({ creada: o.created_at, codigo: o.codigo, proyecto: o.proyecto, ciudad: o.ciudad, etapa: etapaNombre(o.etapa), potencial: o.potencial_meur, resp: o.responsable_id ? nombre(o.responsable_id) : "" })),
            columnas: [{ h: "Creada", k: "creada", tipo: "fecha" as const, w: 12 }, { h: "Código", k: "codigo", w: 10 }, { h: "Obra", k: "proyecto", w: 45 }, { h: "Ciudad", k: "ciudad" },
              { h: "Etapa", k: "etapa", w: 20 }, { h: "Potencial (M€)", k: "potencial", tipo: "meur" as const, w: 12 }, { h: "Responsable", k: "resp" }] },
        ]} nombre={`actividad_${desde}${hasta !== desde ? "_" + hasta : ""}${uSel ? "_" + nombre(uSel).replace(/\s+/g, "_") : ""}`} />
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

      <div className="card space-y-3">
        <h2 className="font-bold text-navy">Resultados comerciales del periodo</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Res t="Oportunidades conseguidas" v={String(conseguidas.length)} s={totConseguido ? meur(totConseguido) : "adjudicadas o firmadas"} fuerte />
          <Res t="Oportunidades nuevas" v={String(nuevas.length)} s="dadas de alta en el CRM" />
          <Res t="Ofertas presentadas" v={String(ofertasPer.length)} s="registradas en el diario" />
          <Res t="Conseguidas en total (acumulado)" v={String(ganadasTotal.length)} s={meur(ganadasTotal.reduce((s2, o) => s2 + importeOpp(o), 0))} />
        </div>
        {conseguidas.length > 0 ? (
          <table className="w-full">
            <thead><tr><th className="th">Fecha</th><th className="th">Oportunidad</th><th className="th">Etapa</th><th className="th text-right">Importe</th><th className="th">Responsable</th></tr></thead>
            <tbody>{conseguidas.map((o) => (
              <tr key={o.id}><td className="td text-xs">{String(o.cuando).split("-").reverse().join("/")}</td>
                <td className="td"><Link className="text-navy underline" href={`/oportunidades/${o.id}`}>{o.codigo} · {o.proyecto}</Link></td>
                <td className="td text-xs">{etapaNombre(o.etapa)}</td><td className="td text-right">{importeOpp(o) ? meur(importeOpp(o)) : "—"}</td>
                <td className="td text-xs">{o.por ? nombre(o.por) : "—"}</td></tr>))}</tbody>
          </table>
        ) : <p className="text-sm text-slate-500">Ninguna oportunidad conseguida en este periodo.</p>}
        <p className="text-xs text-slate-500">Cuenta como conseguida una oportunidad en «8. Adjudicada» o «9. Contrato firmado» cuya fecha de firma (o de adjudicación) cae en el periodo, o con una actividad «Adjudicación» registrada en el diario en el periodo.</p>
      </div>

      {acts.length === 0 && !conseguidas.length && !nuevas.length ? <div className="card text-sm text-slate-500">No hay actividades registradas en este periodo.</div> : (<>
        {!uSel && (
          <div className="card overflow-x-auto p-0">
            <h2 className="p-3 font-bold text-navy">Por usuario</h2>
            <table className="w-full min-w-[800px]">
              <thead><tr><th className="th">Usuario</th><th className="th text-right">Activ.</th><th className="th text-right">Tiempo</th>
                {GRUPOS_ACT.map((g) => <th key={g} className="th text-right"><span style={{ color: GRUPO_COLOR[g] }}>■</span> {g}</th>)}
                <th className="th text-right">Personas</th><th className="th text-right">Contactos nuevos</th><th className="th text-right">Opps. nuevas</th><th className="th text-right">Ofertas</th><th className="th text-right">Conseguidas</th></tr></thead>
              <tbody>{porUsuario.map(({ id, l }) => (
                <tr key={id}>
                  <td className="td"><Link className="text-navy underline" href={`/informes?desde=${desde}&hasta=${hasta}&u=${id}`}>{nombre(id)}</Link></td>
                  <td className="td text-right">{l.length}</td><td className="td text-right font-semibold">{horas(minutos(l))}</td>
                  {GRUPOS_ACT.map((g) => { const x = l.filter((a) => grupo(a.tipo) === g); return <td key={g} className="td text-right text-xs">{x.length ? `${horas(minutos(x))} (${x.length})` : "—"}</td>; })}
                  <td className="td text-right">{new Set(l.flatMap((a) => (a.personas ?? []).map((p: any) => p.contacto?.id))).size}</td>
                  <td className="td text-right">{l.reduce((s, a) => s + (a.personas ?? []).filter((p: any) => p.nuevo).length, 0)}</td>
                  {(() => { const r = resultadosPor(id); return <><td className="td text-right">{r.nuevas}</td><td className="td text-right">{r.ofertas}</td>
                    <td className="td text-right font-semibold">{r.conseguidas.length}{r.conseguidas.length > 0 && <div className="text-xs font-normal">{meur(r.conseguidas.reduce((s2, o) => s2 + importeOpp(o), 0))}</div>}</td></>; })()}
                </tr>))}
                <tr className="font-semibold"><td className="td">Total</td><td className="td text-right">{acts.length}</td><td className="td text-right">{horas(minutos(acts))}</td>
                  {GRUPOS_ACT.map((g) => <td key={g} className="td text-right text-xs">{horas(minutos(acts.filter((a) => grupo(a.tipo) === g)))}</td>)}<td className="td" /><td className="td" />
                  <td className="td text-right">{nuevas.length}</td><td className="td text-right">{ofertasPer.length}</td><td className="td text-right">{conseguidas.length}</td></tr>
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

        {porUsuario.filter(({ l }) => l.length > 0).map(({ id, l }, i) => (
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

function Res({ t, v, s, fuerte }: { t: string; v: string; s?: string; fuerte?: boolean }) {
  return (
    <div className={`rounded border p-2 ${fuerte ? "border-navy bg-blue-50" : "bg-slate-50"}`}>
      <div className="text-xs text-slate-500">{t}</div><div className="text-2xl font-bold text-navy">{v}</div>{s && <div className="text-xs text-slate-500">{s}</div>}
    </div>
  );
}
