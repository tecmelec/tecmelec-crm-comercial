import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import { meur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { sb, perfil } = await getSesion();
  if (!perfil) return <SinAcceso />;
  const [{ data: plan }, { data: acts }, { data: firmadas }] = await Promise.all([
    sb.from("crm_plan_semanal").select("*").order("semana"),
    sb.from("crm_actividades").select("tipo,nuevo_contacto,fecha").gte("fecha", "2026-09-21"),
    sb.from("crm_oportunidades").select("importe_contratado_meur,importe_ofertado_meur,fecha_firma").eq("etapa", "9"),
  ]);
  const hoy = new Date().toISOString().slice(0, 10);
  const enSemana = (f: string, p: any) => f.slice(0, 10) >= p.inicio && f.slice(0, 10) <= p.fin;
  let objAcum = 0, realAcum = 0;
  const filas = (plan ?? []).map((p) => {
    const A = (acts ?? []).filter((a) => enSemana(a.fecha, p));
    const contr = (firmadas ?? []).filter((o) => o.fecha_firma && enSemana(o.fecha_firma, p)).reduce((s, o) => s + Number(o.importe_contratado_meur ?? o.importe_ofertado_meur ?? 0), 0);
    objAcum += Number(p.contratos_meur ?? 0); realAcum += contr;
    return { p, actual: hoy >= p.inicio && hoy <= p.fin, futura: hoy < p.inicio,
      contactos: A.filter((a) => a.nuevo_contacto).length, reuniones: A.filter((a) => a.tipo === "reunion").length,
      rfq: A.filter((a) => a.tipo === "rfq").length, ofertas: A.filter((a) => a.tipo === "oferta").length, contr, objAcum, realAcum };
  });
  const cel = (real: number, obj: number, futura: boolean) =>
    futura ? <span className="text-slate-400">— / {obj}</span> : <span className={real >= obj ? "text-green-700" : "text-red-600"}><b>{real}</b> / {obj}</span>;
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-navy">Plan semanal: real / objetivo</h1>
      <p className="text-sm text-slate-600">Los valores reales salen de las actividades registradas (contacto nuevo, reunión, RFQ, oferta) y de las oportunidades en «9. Contrato firmado» con fecha de firma.</p>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[1000px]">
          <thead><tr><th className="th">Sem.</th><th className="th">Fechas</th><th className="th">Objetivo</th><th className="th">Obras</th><th className="th">Contactos</th><th className="th">Reuniones</th><th className="th">RFQ</th><th className="th">Ofertas</th><th className="th">Contratado acum. real / obj.</th><th className="th">Resp.</th></tr></thead>
          <tbody>{filas.map(({ p, actual, futura, contactos, reuniones, rfq, ofertas, objAcum, realAcum }) => (
            <tr key={p.semana} className={actual ? "bg-yellow-50" : ""}>
              <td className="td font-semibold">{p.semana}</td>
              <td className="td text-xs whitespace-nowrap">{new Date(p.inicio).toLocaleDateString("es-ES")} – {new Date(p.fin).toLocaleDateString("es-ES")}</td>
              <td className="td text-xs">{p.objetivo}</td><td className="td text-xs">{p.obras}</td>
              <td className="td">{cel(contactos, p.contactos, futura)}</td><td className="td">{cel(reuniones, p.reuniones, futura)}</td>
              <td className="td">{cel(rfq, p.rfq, futura)}</td><td className="td">{cel(ofertas, p.ofertas, futura)}</td>
              <td className="td text-xs whitespace-nowrap">{futura ? "—" : meur(realAcum, 1)} / {meur(objAcum, 1)}</td>
              <td className="td text-xs">{p.responsable}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
