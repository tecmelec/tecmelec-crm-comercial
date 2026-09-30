import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import ListaContactos from "@/components/ListaContactos";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const [{ data: contactos }, { data: empresas }, { data: opps }] = await Promise.all([
    sb.from("crm_contactos").select("id,nombre,cargo,email,telefono,linkedin,notas,empresa_id").order("nombre"),
    sb.from("crm_empresas").select("id,nombre,tipo"),
    sb.from("crm_oportunidades").select("id,codigo,proyecto,contacto_id,etapa"),
  ]);
  const emp = new Map((empresas ?? []).map((e) => [e.id, e]));
  const obras: Record<string, any[]> = {};
  (opps ?? []).forEach((o) => o.contacto_id && (obras[o.contacto_id] ??= []).push(o));
  const filas = (contactos ?? []).map((c) => ({ ...c, empresa: c.empresa_id ? emp.get(c.empresa_id) ?? null : null, obras: obras[c.id] ?? [] }));
  return <ListaContactos contactos={filas} />;
}
