"use client";
/** Genera y descarga un .xlsx con una o varias hojas (exceljs se carga solo al pulsar el botón). */
export type Columna = { h: string; k: string; w?: number; tipo?: "texto" | "numero" | "fecha" | "meur" };
export type Hoja = { nombre: string; columnas: Columna[]; filas: Record<string, any>[]; titulo?: string };

export async function descargarExcel(archivo: string, hojas: Hoja[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "CRM Comercial Tecmelec";
  wb.created = new Date();
  for (const h of hojas) {
    const ws = wb.addWorksheet(h.nombre.slice(0, 31), { views: [{ state: "frozen", ySplit: h.titulo ? 2 : 1 }] });
    if (h.titulo) {
      ws.addRow([h.titulo]).font = { bold: true, size: 12, color: { argb: "FF1F3864" } };
    }
    const cab = ws.addRow(h.columnas.map((c) => c.h));
    cab.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3864" } };
      c.alignment = { vertical: "middle", wrapText: true };
    });
    for (const f of h.filas) {
      ws.addRow(h.columnas.map((c) => {
        const v = f[c.k];
        if (v == null || v === "") return null;
        if (c.tipo === "numero" || c.tipo === "meur") return Number(v);
        if (c.tipo === "fecha") { const d = new Date(String(v).length === 10 ? `${v}T12:00:00` : v); return isNaN(d.getTime()) ? v : d; }
        return String(v);
      }));
    }
    h.columnas.forEach((c, i) => {
      const col = ws.getColumn(i + 1);
      col.width = c.w ?? 18;
      if (c.tipo === "fecha") col.numFmt = "dd/mm/yyyy";
      if (c.tipo === "meur") col.numFmt = "#,##0.00";
      col.alignment = { vertical: "top", wrapText: (c.w ?? 18) >= 30 };
    });
    const filaCab = h.titulo ? 2 : 1;
    ws.autoFilter = { from: { row: filaCab, column: 1 }, to: { row: filaCab, column: h.columnas.length } };
  }
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${archivo}.xlsx`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
