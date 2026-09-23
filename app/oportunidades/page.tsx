import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import ListaOportunidades from "@/components/ListaOportunidades";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const [{ data }, { data: usuarios }] = await Promise.all([
    sb.from("crm_oportunidades").select("id,codigo,proyecto,ciudad,tipo_activo,prioridad,etapa,constructor,potencial_meur,paquete_meur,importe_ofertado_meur,ventana_adjudicacion,fecha_proxima_accion,proxima_accion,responsable_id").order("codigo"),
    sb.from("crm_usuarios").select("user_id,nombre"),
  ]);
  return <ListaOportunidades opps={data ?? []} usuarios={usuarios ?? []} />;
}
