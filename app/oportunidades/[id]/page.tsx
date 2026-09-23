import Link from "next/link";
import { notFound } from "next/navigation";
import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import OportunidadForm from "@/components/OportunidadForm";
import ActividadForm from "@/components/ActividadForm";
import Timeline from "@/components/Timeline";
import { firmarFotos } from "@/lib/fotos";
import { PRIO_COLOR } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const { data: opp } = await sb.from("crm_oportunidades").select("*").eq("id", params.id).maybeSingle();
  if (!opp) notFound();
  const [{ data: acts }, { data: empresas }, { data: usuarios }, { data: contactos }, { data: lics }] = await Promise.all([
    sb.from("crm_actividades").select("*").eq("oportunidad_id", opp.id).order("fecha", { ascending: false }),
    sb.from("crm_empresas").select("id,nombre").order("nombre"),
    sb.from("crm_usuarios").select("user_id,nombre").eq("activo", true),
    opp.empresa_id ? sb.from("crm_contactos").select("id,nombre,cargo").eq("empresa_id", opp.empresa_id) : Promise.resolve({ data: [] as any[] }),
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
        {opp.url && <a href={opp.url} target="_blank" rel="noreferrer" className="text-xs text-navy underline">Fuente: {opp.fuente}</a>}
        {opp.empresa_id && <> · <Link className="text-xs text-navy underline" href={`/empresas/${opp.empresa_id}`}>Ver empresa</Link></>}
        {(lics ?? []).map((l) => <div key={l.id} className="text-xs">Licitación vinculada: <a className="underline" href={l.url} target="_blank" rel="noreferrer">{l.titulo}</a></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><OportunidadForm opp={opp} empresas={empresas ?? []} contactos={contactos ?? []} usuarios={usuarios ?? []} /></div>
        <div className="space-y-3">
          <h2 className="font-bold text-navy">Registrar actividad</h2>
          <ActividadForm oportunidadId={opp.id} empresaId={opp.empresa_id} contactos={contactos ?? []} />
          <h2 className="font-bold text-navy">Historial</h2>
          <Timeline acts={acts ?? []} usuarios={usuarios ?? []} fotos={fotos} />
        </div>
      </div>
    </div>
  );
}
