import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import OportunidadForm from "@/components/OportunidadForm";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { lic?: string } }) {
  const { sb, perfil, user } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const [{ data: empresas }, { data: usuarios }] = await Promise.all([
    sb.from("crm_empresas").select("id,nombre").order("nombre"),
    sb.from("crm_usuarios").select("user_id,nombre").eq("activo", true),
  ]);
  let base: any = { responsable_id: user!.id, fecha_info: new Date().toLocaleDateString("es-ES") };
  if (searchParams.lic) {
    const { data: l } = await sb.from("crm_licitaciones").select("*").eq("id", searchParams.lic).maybeSingle();
    if (l) base = {
      ...base, proyecto: l.titulo, ciudad: l.lugar, promotor: l.organo, fuente: "PLACSP", url: l.url,
      presupuesto_txt: l.importe_eur ? `${Number(l.importe_eur).toLocaleString("es-ES")} € (licitación)` : null,
      base_obra_meur: l.importe_eur ? Number(l.importe_eur) / 1e6 : null, pct_electrico: 0.12, pct_captable: 0.5,
      fase_obra: l.estado_licitacion, estado_electrico: "Sin contratar", notas: `Creada desde licitación. ${l.motivo ?? ""}`, _lic: l.id,
    };
  }
  const { _lic, ...opp } = base;
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-navy">Nueva oportunidad</h1>
      <OportunidadForm opp={opp} empresas={empresas ?? []} contactos={[]} usuarios={usuarios ?? []} nueva licitacionId={_lic} />
    </div>
  );
}
