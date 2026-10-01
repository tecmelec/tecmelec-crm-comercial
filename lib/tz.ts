/** Utilidades de fecha en hora de Madrid (el servidor de Vercel trabaja en UTC). */
export const TZ = "Europe/Madrid";

function offsetMin(d: Date) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" }).formatToParts(d).find((x) => x.type === "timeZoneName")?.value ?? "GMT";
  const m = p.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
}
/** Fecha de hoy (YYYY-MM-DD) en Madrid. */
export const hoyMadrid = () => new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
/** Instante UTC en que empieza el día indicado en Madrid. */
export function inicioDia(dia: string) {
  const [y, m, d] = dia.split("-").map(Number);
  const aprox = new Date(Date.UTC(y, m - 1, d, 12));
  return new Date(Date.UTC(y, m - 1, d) - offsetMin(aprox) * 60000);
}
export const sumarDias = (dia: string, n: number) => {
  const [y, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
export const diaDe = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });
export const horaDe = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
export const fechaLarga = (dia: string) =>
  new Date(`${dia}T12:00:00Z`).toLocaleDateString("es-ES", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const esDia = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
