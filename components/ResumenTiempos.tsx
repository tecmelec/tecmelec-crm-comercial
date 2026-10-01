import { GRUPOS_ACT, GRUPO_COLOR, TIPOS_ACT, horas } from "@/lib/constantes";

/** Totales de tiempo y número de actividades por grupo (barra apilada + leyenda). */
export default function ResumenTiempos({ acts, compacto }: { acts: any[]; compacto?: boolean }) {
  const total = acts.reduce((s, a) => s + Number(a.duracion_min ?? 0), 0);
  const grupos = GRUPOS_ACT.map((g) => {
    const l = acts.filter((a) => (TIPOS_ACT.find((t) => t.v === a.tipo)?.g ?? "Trabajo interno") === g);
    return { g, n: l.length, min: l.reduce((s, a) => s + Number(a.duracion_min ?? 0), 0) };
  }).filter((x) => x.n > 0);
  const personas = new Set(acts.flatMap((a) => (a.personas ?? []).map((p: any) => p.contacto?.id)).filter(Boolean));
  const nuevos = acts.reduce((s, a) => s + (a.personas ?? []).filter((p: any) => p.nuevo).length, 0);
  const sinTiempo = acts.filter((a) => !a.duracion_min).length;
  return (
    <div className="space-y-2">
      <div className={`grid gap-2 ${compacto ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4"}`}>
        <Dato t="Tiempo registrado" v={horas(total)} />
        <Dato t="Actividades" v={String(acts.length)} />
        <Dato t="Personas contactadas" v={String(personas.size)} />
        <Dato t="Contactos nuevos" v={String(nuevos)} />
      </div>
      {total > 0 && (
        <div>
          <div className="flex h-4 w-full overflow-hidden rounded bg-slate-200">
            {grupos.filter((x) => x.min > 0).map((x) => (
              <div key={x.g} title={`${x.g}: ${horas(x.min)}`} style={{ width: `${(x.min / total) * 100}%`, background: GRUPO_COLOR[x.g] }} />
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {grupos.map((x) => (
              <span key={x.g} className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: GRUPO_COLOR[x.g] }} />
                {x.g}: <b>{horas(x.min)}</b> ({x.n}) {total > 0 && <span className="text-slate-500">{Math.round((x.min / total) * 100)}%</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      {sinTiempo > 0 && <p className="text-xs text-amber-700">{sinTiempo} actividad(es) sin tiempo indicado.</p>}
    </div>
  );
}

function Dato({ t, v }: { t: string; v: string }) {
  return <div className="rounded border bg-slate-50 p-2"><div className="text-xs text-slate-500">{t}</div><div className="text-lg font-bold text-navy">{v}</div></div>;
}
