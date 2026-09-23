export const meur = (v: number | null | undefined, d = 2) =>
  v == null || isNaN(Number(v)) ? "—" : Number(v).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }) + " M€";
export const eur = (v: number | null | undefined) =>
  v == null ? "—" : Number(v).toLocaleString("es-ES", { maximumFractionDigits: 0 }) + " €";
export const fecha = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString("es-ES") : "—");
export const hoyISO = () => new Date().toISOString().slice(0, 10);
export const pct = (v: number | null | undefined) => (v == null ? "—" : Math.round(Number(v) * 100) + "%");
