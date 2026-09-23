import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import ListaLicitaciones from "@/components/ListaLicitaciones";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const [{ data }, { data: cfg }] = await Promise.all([
    sb.from("crm_licitaciones").select("*").order("fecha_publicacion", { ascending: false }).limit(300),
    sb.from("crm_config").select("valor").eq("clave", "alertas_ultima_ejecucion").maybeSingle(),
  ]);
  return <ListaLicitaciones lics={data ?? []} ultima={cfg?.valor ?? null} />;
}
