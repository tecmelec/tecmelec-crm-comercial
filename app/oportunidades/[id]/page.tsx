import Link from "next/link";
import { notFound } from "next/navigation";
import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import OportunidadForm from "@/components/OportunidadForm";
import DiarioForm from "@/components/DiarioForm";
import { SELECT_ACT } from "@/lib/diario";
import Timeline from "@/components/Timeline";
import { firmarFotos } from "@/lib/fotos";
import { PRIO_COLOR, DOC_COLOR, etapaNombre } from "@/lib/constantes";
import { fecha } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const { sb, user, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const { data: opp } = await sb.from("crm_oportunidades").select("*").eq("id", params.id).maybeSingle();
  if (!opp) notFound();
  const [{ data: acts }, { data: empresas }, { data: usuarios }, { data: contactos }, { data: lics }] = await Promise.all([
    sb.from("crm_actividades").select(SELECT_ACT).eq("oportunidad_id", opp.id).order("fecha", { ascending: false }),
    sb.from("crm_empresas").select("id,nombre").order("nombre"),
    sb.from("crm_usuarios").select("user_id,nombre").eq("activo", true),
    contactosDe(sb, opp),
    sb.from("crm_licitaciones").select("id,titulo,url").eq("oportunidad_id", opp.id),
  ]);
  const fotos = await firmarFotos(sb, acts ?? []);
  return (
    <div className="space-y-4">
      <div>
        <Link href="/oportunidades" className="text-sm text-navy underline">← Oportunidades</Link>
        <h1 className="mt-1 text-lg font-bold text-navy">
          <span className={`badge mr-2 ${PRIO_COLOR[opp.prioridad]}`}>{opp.prioridad}</span>{opp.codigo} · {opp.proyecto}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className="badge bg-slate-100">{etapaNombre(opp.etapa)}</span>
          {opp.estado_seguimiento && <span className="badge bg-indigo-100 text-indigo-900">{opp.estado_seguimiento}</span>}
          {opp.estado_documentacion && <span className={`badge ${DOC_COLOR[opp.estado_documentacion] ?? ""}`}>Doc.: {opp.estado_documentacion}</span>}
          {opp.fecha_ultimo_contacto && <span>Último contacto: {fecha(opp.fecha_ultimo_contacto)}</span>}
          {opp.direccion && <span>· {opp.direccion}{opp.ciudad ? `, ${opp.ciudad}` : ""}</span>}
        </div>
        {opp.url ? <a href={opp.url} target="_blank" rel="noreferrer" className="text-xs text-navy underline">Fuente: {opp.fuente}</a> : opp.fuente && <span className="text-xs text-slate-500">Fuente: {opp.fuente}</span>}
        {opp.empresa_id && <> · <Link className="text-xs text-navy underline" href={`/empresas/${opp.empresa_id}`}>Ver empresa</Link></>}
        {opp.promotor_id && opp.promotor_id !== opp.empresa_id && <> · <Link className="text-xs text-navy underline" href={`/empresas/${opp.promotor_id}`}>Ver promotor</Link></>}
        {(lics ?? []).map((l) => <div key={l.id} className="text-xs">Licitación vinculada: <a className="underline" href={l.url} target="_blank" rel="noreferrer">{l.titulo}</a></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><OportunidadForm opp={opp} empresas={empresas ?? []} contactos={contactos ?? []} usuarios={usuarios ?? []} /></div>
        <div className="space-y-3">
          {(contactos ?? []).length > 0 && (
            <div className="card text-sm">
              <h2 className="mb-1 font-bold text-navy">Contactos de la obra</h2>
              {(contactos ?? []).map((c: any) => (
                <div key={c.id} className="border-b py-1 last:border-0">
                  <b>{c.nombre}</b>{c.cargo && <span className="text-slate-500"> · {c.cargo}</span>}{c.id === opp.contacto_id && <span className="badge ml-1 bg-orange-100 text-orange-900">principal</span>}
                  <div className="flex flex-wrap gap-3 text-xs">
                    {c.telefono && <a className="text-navy underline" href={`tel:${c.telefono}`}>{c.telefono}</a>}
                    {c.email && <a className="text-navy underline" href={`mailto:${c.email}`}>{c.email}</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <h2 className="font-bold text-navy">Registrar actividad</h2>
          <DiarioForm oportunidadId={opp.id} empresaId={opp.empresa_id} />
          <h2 className="font-bold text-navy">Historial</h2>
          <Timeline acts={acts ?? []} usuarios={usuarios ?? []} fotos={fotos} usuarioId={user?.id} esAdmin={["admin", "direccion"].includes(perfil.rol)} />
        </div>
      </div>
    </div>
  );
}

/** Contactos de la empresa vinculada y del promotor, más el contacto principal aunque sea de otra empresa. */
async function contactosDe(sb: any, opp: any) {
  const ids = [opp.empresa_id, opp.promotor_id].filter(Boolean);
  const filtros = [ids.length ? `empresa_id.in.(${ids.join(",")})` : null, opp.contacto_id ? `id.eq.${opp.contacto_id}` : null].filter(Boolean);
  if (!filtros.length) return { data: [] as any[] };
  return sb.from("crm_contactos").select("id,nombre,cargo,email,telefono").or(filtros.join(",")).order("nombre");
}
