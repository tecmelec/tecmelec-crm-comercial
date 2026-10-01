"use client";
import { useMemo, useState } from "react";

/** Selector con búsqueda (sirve para listas largas de empresas u obras). */
export default function Buscador({ items, value, onChange, placeholder, etiqueta }: {
  items: { id: string; t: string; s?: string }[]; value: string; onChange: (id: string) => void; placeholder?: string; etiqueta?: string;
}) {
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const sel = items.find((i) => i.id === value);
  const lista = useMemo(() => {
    const t = q.toLowerCase();
    return items.filter((i) => !t || (i.t + " " + (i.s ?? "")).toLowerCase().includes(t)).slice(0, 30);
  }, [items, q]);
  return (
    <div className="relative">
      {etiqueta && <label className="lbl">{etiqueta}</label>}
      {sel && !abierto ? (
        <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
          <span className="grow truncate">{sel.t}{sel.s && <span className="text-slate-500"> · {sel.s}</span>}</span>
          <button type="button" className="text-xs text-navy underline" onClick={() => { setAbierto(true); setQ(""); }}>cambiar</button>
          <button type="button" className="text-xs text-slate-500" onClick={() => onChange("")} aria-label="Quitar">✕</button>
        </div>
      ) : (
        <input className="inp" placeholder={placeholder ?? "Buscar…"} value={q} autoFocus={abierto}
          onFocus={() => setAbierto(true)} onBlur={() => setTimeout(() => setAbierto(false), 150)} onChange={(e) => setQ(e.target.value)} />
      )}
      {abierto && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow">
          {lista.map((i) => (
            <button type="button" key={i.id} className="block w-full px-2 py-1 text-left text-sm hover:bg-slate-100"
              onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(i.id); setAbierto(false); setQ(""); }}>
              {i.t}{i.s && <span className="text-xs text-slate-500"> · {i.s}</span>}
            </button>
          ))}
          {lista.length === 0 && <div className="px-2 py-1 text-sm text-slate-500">Sin resultados</div>}
        </div>
      )}
    </div>
  );
}
