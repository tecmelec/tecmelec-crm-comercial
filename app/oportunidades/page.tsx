import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import ListaOportunidades from "@/components/ListaOportunidades";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const [{ data }, { data: usuarios }] = await Promise.all([
    sb.from("crm_oportunidades").select("id,codigo,proyecto,ciudad,tipo_activo,prioridad,etapa,constructor,potencial_meur,paquete_meur,importe_ofertado_meur,ventana_adjudicacion,fecha_proxima_accion,proxima_accion,responsable_id,promotor,direccion,estado_seguimiento,estado_documentacion,fecha_ultimo_contacto,origen,gestionado_por,contacto_objetivo,created_at").order("codigo"),
    sb.from("crm_usuarios").select("user_id,nombre"),
  ]);
  const inicial = { vencidas: searchParams.vencidas === "1", origen: searchParams.origen, seg: searchParams.seg, doc: searchParams.doc };
  return <ListaOportunidades opps={data ?? []} usuarios={usuarios ?? []} inicial={inicial} />;
}
