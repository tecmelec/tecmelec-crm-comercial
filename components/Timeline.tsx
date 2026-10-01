"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { TIPOS_ACT, GRUPO_COLOR, tipoNombre, horas } from "@/lib/constantes";
import { fecha } from "@/lib/format";
import DiarioForm from "@/components/DiarioForm";

type Props = { acts: any[]; usuarios: any[]; fotos: Record<string, string>; usuarioId?: string; esAdmin?: boolean; soloHora?: boolean };

/** Historial de actividades con duración, personas, empresa y obra. Cada usuario puede corregir o borrar las suyas. */
export default function Timeline({ acts, usuarios, fotos, usuarioId, esAdmin, soloHora }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const nombre = (id: string) => usuarios.find((u) => u.user_id === id)?.nombre ?? "—";
  if (!acts.length) return <p className="text-sm text-slate-500">Sin actividad registrada.</p>;

  async function borrar(id: string) {
    if (!confirm("¿Borrar esta actividad?")) return;
    const { error } = await supabaseBrowser().from("crm_actividades").delete().eq("id", id);
    if (error) alert(error.message); else router.refresh();
  }

  return (
    <ul className="space-y-2">
      {acts.map((a) => {
        const g = TIPOS_ACT.find((t) => t.v === a.tipo)?.g ?? "";
        const puede = esAdmin || (usuarioId && a.usuario_id === usuarioId);
        if (editando === a.id) return (
          <li key={a.id}>
            <DiarioForm actividad={a} onHecho={() => setEditando(null)} />
            <button className="btn-sec mt-1 text-xs" onClick={() => setEditando(null)}>Cancelar</button>
          </li>
        );
        const t = new Date(a.fecha);
        return (
          <li key={a.id} className="rounded border bg-white p-2 text-sm" style={{ borderLeft: `4px solid ${GRUPO_COLOR[g] ?? "#ccc"}` }}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{soloHora ? t.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : t.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</span>
              <span className="font-semibold text-navy">{tipoNombre(a.tipo)}</span>
              {a.duracion_min ? <span className="badge bg-slate-100 text-slate-800">⏱ {horas(a.duracion_min)}</span> : null}
              <span>{nombre(a.usuario_id)}</span>
              {a.nuevo_contacto && <span className="badge bg-green-100 text-green-800">contacto nuevo</span>}
              {puede && (
                <span className="ml-auto flex gap-2">
                  <button className="underline" onClick={() => setEditando(a.id)}>editar</button>
                  <button className="text-red-600 underline" onClick={() => borrar(a.id)}>borrar</button>
                </span>
              )}
            </div>
            {(a.empresa || a.oportunidad) && (
              <div className="text-xs">
                {a.empresa && <Link className="text-navy underline" href={`/empresas/${a.empresa.id}`}>{a.empresa.nombre}</Link>}
                {a.empresa && a.oportunidad && " · "}
                {a.oportunidad && <Link className="text-navy underline" href={`/oportunidades/${a.oportunidad.id}`}>{a.oportunidad.codigo} {a.oportunidad.proyecto}</Link>}
              </div>
            )}
            {a.personas?.length > 0 && (
              <div className="text-xs">👤 {a.personas.map((p: any, i: number) => (
                <span key={i}>{i > 0 && ", "}{p.contacto?.nombre}{p.contacto?.cargo ? ` (${p.contacto.cargo})` : ""}{p.nuevo && <b className="text-green-700"> nuevo</b>}</span>
              ))}</div>
            )}
            <p className="whitespace-pre-wrap">{a.resumen}</p>
            {a.siguiente_paso && <p className="text-xs">➜ {a.siguiente_paso} {a.fecha_siguiente && `(${fecha(a.fecha_siguiente)})`}</p>}
            {a.foto_path && fotos[a.foto_path] && (
              <a href={fotos[a.foto_path]} target="_blank" rel="noreferrer"><img src={fotos[a.foto_path]} alt="foto" className="mt-1 max-h-40 rounded" /></a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
