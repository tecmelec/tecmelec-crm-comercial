import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import ListaEmpresas from "@/components/ListaEmpresas";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const [{ data: empresas }, { data: opps }, { data: contactos }] = await Promise.all([
    sb.from("crm_empresas").select("id,nombre,tipo,subtipo,obras_vinculadas,cargos_objetivo,estrategia").order("nombre"),
    sb.from("crm_oportunidades").select("empresa_id"),
    sb.from("crm_contactos").select("empresa_id"),
  ]);
  const nOpp: Record<string, number> = {}; (opps ?? []).forEach((o) => o.empresa_id && (nOpp[o.empresa_id] = (nOpp[o.empresa_id] ?? 0) + 1));
  const nCon: Record<string, number> = {}; (contactos ?? []).forEach((c) => c.empresa_id && (nCon[c.empresa_id] = (nCon[c.empresa_id] ?? 0) + 1));
  return <ListaEmpresas empresas={(empresas ?? []).map((e) => ({ ...e, nOpp: nOpp[e.id] ?? 0, nCon: nCon[e.id] ?? 0 }))} />;
}
