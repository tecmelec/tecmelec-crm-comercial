import { TIPOS_ACT } from "@/lib/constantes";
import { fecha } from "@/lib/format";

export default function Timeline({ acts, usuarios, fotos }: { acts: any[]; usuarios: any[]; fotos: Record<string, string> }) {
  const nombre = (id: string) => usuarios.find((u) => u.user_id === id)?.nombre ?? "—";
  const tipo = (v: string) => TIPOS_ACT.find((t) => t.v === v)?.n ?? v;
  if (!acts.length) return <p className="text-sm text-slate-500">Sin actividad registrada todavía.</p>;
  return (
    <ul className="space-y-2">
      {acts.map((a) => (
        <li key={a.id} className="rounded border bg-white p-2 text-sm">
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span>{new Date(a.fecha).toLocaleString("es-ES")}</span><span className="font-semibold text-navy">{tipo(a.tipo)}</span>
            <span>{nombre(a.usuario_id)}</span>{a.nuevo_contacto && <span className="badge bg-green-100 text-green-800">contacto nuevo</span>}
          </div>
          <p className="whitespace-pre-wrap">{a.resumen}</p>
          {a.siguiente_paso && <p className="text-xs">➜ {a.siguiente_paso} {a.fecha_siguiente && `(${fecha(a.fecha_siguiente)})`}</p>}
          {a.foto_path && fotos[a.foto_path] && (
            <a href={fotos[a.foto_path]} target="_blank" rel="noreferrer"><img src={fotos[a.foto_path]} alt="foto" className="mt-1 max-h-40 rounded" /></a>
          )}
        </li>
      ))}
    </ul>
  );
}
