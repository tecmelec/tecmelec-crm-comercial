import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import GestionUsuarios from "@/components/GestionUsuarios";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sb, perfil } = await getSesion();
  if (!perfil || !["admin", "direccion"].includes(perfil.rol)) return <SinAcceso />;
  const { data } = await sb.from("crm_usuarios").select("*").order("nombre");
  return <GestionUsuarios usuarios={data ?? []} puedeCrear={!!process.env.SUPABASE_SERVICE_ROLE_KEY} />;
}
