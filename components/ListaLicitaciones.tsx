"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { eur, fecha } from "@/lib/format";

export default function ListaLicitaciones({ lics, ultima }: { lics: any[]; ultima: string | null }) {
  const router = useRouter();
  const [estado, setEstado] = useState("nueva");
  const lista = lics.filter((l) => !estado || l.estado === estado);
  async function marcar(id: string, e: string) {
    await supabaseBrowser().from("crm_licitaciones").update({ estado: e }).eq("id", id);
    router.refresh();
  }
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-navy">Licitaciones detectadas</h1>
      <p className="text-sm text-slate-600">
        Revisión automática de la Plataforma de Contratación del Sector Público (incluye plataformas autonómicas agregadas) de lunes a viernes a las 8:00.
        Filtro: obras en Madrid, C. Valenciana, Guadalajara y Toledo con CPV de edificación/instalaciones e importe ≥ 1 M€ (≥ 250.000 € si es instalación eléctrica).
        Las <b>adjudicadas</b> se incluyen porque son oportunidades de subcontratación. Última ejecución: {ultima ? new Date(ultima).toLocaleString("es-ES") : "—"}.
      </p>
      <div className="flex gap-2">
        {[["nueva", "Nuevas"], ["revisada", "Revisadas"], ["convertida", "Convertidas"], ["descartada", "Descartadas"], ["", "Todas"]].map(([v, n]) => (
          <button key={v} className={estado === v ? "btn" : "btn-sec"} onClick={() => setEstado(v)}>{n}</button>
        ))}
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px]">
          <thead><tr><th className="th">Título</th><th className="th">Órgano</th><th className="th text-right">Importe</th><th className="th">Lugar</th><th className="th">Estado</th><th className="th">Plazo</th><th className="th">Motivo</th><th className="th">Acción</th></tr></thead>
          <tbody>
            {lista.map((l) => (
              <tr key={l.id}>
                <td className="td">{l.url ? <a className="text-navy underline" href={l.url} target="_blank" rel="noreferrer">{l.titulo}</a> : l.titulo}</td>
                <td className="td text-xs">{l.organo}</td>
                <td className="td text-right whitespace-nowrap">{eur(l.importe_eur)}</td>
                <td className="td text-xs">{l.lugar}</td>
                <td className="td text-xs">{l.estado_licitacion}</td>
                <td className="td text-xs">{fecha(l.fecha_limite)}</td>
                <td className="td text-xs">{l.motivo}</td>
                <td className="td whitespace-nowrap text-xs">
                  {l.oportunidad_id ? <Link className="underline" href={`/oportunidades/${l.oportunidad_id}`}>ver oportunidad</Link> : (
                    <div className="flex flex-col gap-1">
                      <Link className="btn py-1" href={`/oportunidades/nueva?lic=${l.id}`}>Crear oportunidad</Link>
                      <button className="btn-sec py-1" onClick={() => marcar(l.id, "revisada")}>Revisada</button>
                      <button className="btn-sec py-1" onClick={() => marcar(l.id, "descartada")}>Descartar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td className="td" colSpan={8}>Nada en esta vista.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
