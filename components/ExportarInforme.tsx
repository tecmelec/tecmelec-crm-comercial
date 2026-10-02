"use client";
import { useState } from "react";
import { descargarExcel, type Hoja } from "@/lib/excel";

/** Botones del informe: imprimir/guardar PDF y descargar Excel. */
export default function ExportarInforme({ hojas, nombre }: { hojas: Hoja[]; nombre: string }) {
  const [ocupado, setOcupado] = useState(false);
  async function excel() {
    setOcupado(true);
    try { await descargarExcel(nombre, hojas); } catch (e: any) { alert("No se pudo generar el Excel: " + e.message); }
    setOcupado(false);
  }
  return (
    <div className="no-print flex gap-2">
      <button className="btn-sec" onClick={() => window.print()}>Imprimir / PDF</button>
      <button className="btn-sec" onClick={excel} disabled={ocupado || hojas.every((h) => !h.filas.length)}>{ocupado ? "Generando…" : "Descargar Excel"}</button>
    </div>
  );
}
