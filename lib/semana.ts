/** Lunes 00:00 (hora local del servidor) de la semana que contiene la fecha d. */
export function inicioSemana(d = new Date()) {
  const x = new Date(d);
  const dia = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - dia);
  return x;
}
export const isoDia = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
