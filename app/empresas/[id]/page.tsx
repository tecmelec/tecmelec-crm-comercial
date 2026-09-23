import Link from "next/link";
import { notFound } from "next/navigation";
import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import EmpresaEditor from "@/components/EmpresaEditor";
import ActividadForm from "@/components/ActividadForm";
import Timeline from "@/components/Timeline";
import { firmarFotos } from "@/lib/fotos";
import { etapaNombre, PRIO_COLOR } from "@/lib/constantes";
import { meur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const { data: emp } = await sb.from("crm_empresas").select("*").eq("id", params.id).maybeSingle();
  if (!emp) notFound();
  const [{ data: contactos }, { data: opps }, { data: acts }, { data: usuarios }] = await Promise.all([
    sb.from("crm_contactos").select("*").eq("empresa_id", emp.id).order("nombre"),
    sb.from("crm_oportunidades").select("id,codigo,proyecto,prioridad,etapa,potencial_meur").eq("empresa_id", emp.id),
    sb.from("crm_actividades").select("*").eq("empresa_id", emp.id).order("fecha", { ascending: false }).limit(50),
    sb.from("crm_usuarios").select("user_id,nombre"),
  ]);
  const fotos = await firmarFotos(sb, acts ?? []);
  const datos = Object.entries(emp.datos ?? {});
  return (
    <div className="space-y-4">
      <Link href="/empresas" className="text-sm text-navy underline">← Empresas</Link>
      <h1 className="text-lg font-bold text-navy">{emp.nombre} <span className="text-sm font-normal text-slate-500">({emp.tipo})</span></h1>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <EmpresaEditor empresa={emp} contactos={contactos ?? []} />
          {datos.length > 0 && (
            <div className="card text-sm"><h3 className="mb-1 font-bold text-navy">Características (investigación)</h3>
              {datos.map(([k, v]) => <div key={k}><b>{k.replace(/_/g, " ")}:</b> {String(v)}</div>)}</div>
          )}
          <div className="card"><h3 className="mb-2 font-bold text-navy">Oportunidades vinculadas</h3>
            {(opps ?? []).length === 0 && <p className="text-sm text-slate-500">Ninguna. Vincúlalas desde la ficha de la oportunidad.</p>}
            {(opps ?? []).map((o) => (
              <div key={o.id} className="text-sm"><span className={`badge ${PRIO_COLOR[o.prioridad]}`}>{o.prioridad}</span>{" "}
                <Link className="text-navy underline" href={`/oportunidades/${o.id}`}>{o.codigo} · {o.proyecto}</Link> — {etapaNombre(o.etapa)} · {meur(o.potencial_meur)}</div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="font-bold text-navy">Registrar actividad con la empresa</h2>
          <ActividadForm empresaId={emp.id} opps={[]} contactos={contactos ?? []} />
          <h2 className="font-bold text-navy">Historial</h2>
          <Timeline acts={acts ?? []} usuarios={usuarios ?? []} fotos={fotos} />
        </div>
      </div>
    </div>
  );
}
