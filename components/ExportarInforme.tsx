"use client";

/** Botones del informe: imprimir/guardar PDF y descargar CSV (se abre en Excel). */
export default function ExportarInforme({ filas, nombre }: { filas: Record<string, any>[]; nombre: string }) {
  function csv() {
    if (!filas.length) return;
    const cols = Object.keys(filas[0]);
    const esc = (v: any) => { const s = v == null ? "" : String(v); return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const txt = "﻿" + [cols.join(";"), ...filas.map((f) => cols.map((c) => esc(f[c])).join(";"))].join("\r\n");
    const url = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `${nombre}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div className="no-print flex gap-2">
      <button className="btn-sec" onClick={() => window.print()}>Imprimir / PDF</button>
      <button className="btn-sec" onClick={csv} disabled={!filas.length}>Descargar Excel (CSV)</button>
    </div>
  );
}
