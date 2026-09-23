import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import ActividadForm from "@/components/ActividadForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const { data: opps } = await sb.from("crm_oportunidades").select("id,codigo,proyecto,empresa_id").not("etapa", "in", "(X,Z)").order("codigo");
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="text-lg font-bold text-navy">Registrar actividad</h1>
      <p className="text-sm text-slate-600">Llamada, visita, reunión, RFQ u oferta. 30 segundos desde el móvil, justo al salir de la obra.</p>
      <ActividadForm opps={opps ?? []} />
    </div>
  );
}
