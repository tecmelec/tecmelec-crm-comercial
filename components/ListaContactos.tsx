"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TIPOS_EMPRESA } from "@/lib/constantes";

/** Directorio de contactos: búsqueda por nombre, cargo, empresa, email, teléfono u obra. */
export default function ListaContactos({ contactos }: { contactos: any[] }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [soloNombre, setSoloNombre] = useState(false);
  const generico = (n: string) => /^(recepci|buz[oó]n|centralita|informaci[oó]n|dep\.)/i.test(n ?? "");
  const lista = useMemo(() => {
    const t = q.toLowerCase();
    return contactos.filter((c) =>
      (!t || [c.nombre, c.cargo, c.email, c.telefono, c.empresa?.nombre, ...c.obras.map((o: any) => `${o.codigo} ${o.proyecto}`)].join(" ").toLowerCase().includes(t)) &&
      (!tipo || c.empresa?.tipo === tipo) &&
      (!soloNombre || !generico(c.nombre)));
  }, [contactos, q, tipo, soloNombre]);
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-navy">Contactos ({lista.length})</h1>
      <div className="card grid grid-cols-1 items-center gap-2 md:grid-cols-4">
        <input className="inp md:col-span-2" placeholder="Buscar nombre, cargo, empresa, email, teléfono u obra…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="inp" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Cualquier tipo de empresa</option>{TIPOS_EMPRESA.map((t) => <option key={t}>{t}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={soloNombre} onChange={(e) => setSoloNombre(e.target.checked)} /> Solo personas (sin centralitas/buzones)</label>
      </div>
      <p className="text-xs text-slate-500">Para añadir un contacto, entra en la ficha de su empresa.</p>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px]">
          <thead><tr><th className="th">Nombre</th><th className="th">Cargo</th><th className="th">Empresa</th><th className="th">Teléfono</th><th className="th">Email</th><th className="th">Obras</th></tr></thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="td font-semibold">{c.nombre}</td>
                <td className="td text-xs">{c.cargo}</td>
                <td className="td text-xs">{c.empresa ? <Link className="text-navy underline" href={`/empresas/${c.empresa.id}`}>{c.empresa.nombre}</Link> : "—"}</td>
                <td className="td text-xs whitespace-nowrap">{c.telefono && <a className="text-navy underline" href={`tel:${c.telefono}`}>{c.telefono}</a>}</td>
                <td className="td text-xs">{c.email && <a className="text-navy underline" href={`mailto:${c.email}`}>{c.email}</a>}</td>
                <td className="td text-xs">{c.obras.map((o: any) => <div key={o.id}><Link className="underline" href={`/oportunidades/${o.id}`}>{o.codigo}</Link> {o.proyecto}</div>)}</td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td className="td" colSpan={6}>Sin resultados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
