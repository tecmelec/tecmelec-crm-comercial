export const ETAPAS: { v: string; n: string; p: number }[] = [
  { v: "0", n: "0. Detectada", p: 0 },
  { v: "1", n: "1. Cualificada", p: 0.02 },
  { v: "2", n: "2. Decisor identificado", p: 0.05 },
  { v: "3", n: "3. Reunión realizada", p: 0.1 },
  { v: "4", n: "4. RFQ recibida", p: 0.12 },
  { v: "5", n: "5. En estudio", p: 0.15 },
  { v: "6", n: "6. Oferta presentada", p: 0.2 },
  { v: "7", n: "7. Negociación / shortlist", p: 0.45 },
  { v: "8", n: "8. Adjudicada (carta)", p: 0.9 },
  { v: "9", n: "9. Contrato firmado", p: 1 },
  { v: "X", n: "X. Perdida", p: 0 },
  { v: "Z", n: "Z. Descartada", p: 0 },
];
export const etapaNombre = (v: string) => ETAPAS.find((e) => e.v === v)?.n ?? v;
export const PRIORIDADES = ["P1", "P2", "P3", "Fuera"];
/** Tipos de actividad del diario. g = grupo para informes; externo = cuenta como contacto con cliente. */
export const TIPOS_ACT: { v: string; n: string; g: string; externo: boolean }[] = [
  { v: "visita", n: "Visita (obra / cliente)", g: "Visitas y reuniones", externo: true },
  { v: "reunion", n: "Reunión con cliente", g: "Visitas y reuniones", externo: true },
  { v: "videollamada", n: "Videollamada", g: "Visitas y reuniones", externo: true },
  { v: "llamada", n: "Llamada", g: "Llamadas y emails", externo: true },
  { v: "email", n: "Email", g: "Llamadas y emails", externo: true },
  { v: "linkedin", n: "LinkedIn", g: "Llamadas y emails", externo: true },
  { v: "elaboracion_oferta", n: "Elaboración de oferta", g: "Ofertas", externo: false },
  { v: "rfq", n: "RFQ / documentación recibida", g: "Ofertas", externo: true },
  { v: "oferta", n: "Oferta presentada", g: "Ofertas", externo: true },
  { v: "negociacion", n: "Negociación", g: "Ofertas", externo: true },
  { v: "adjudicacion", n: "Adjudicación", g: "Ofertas", externo: true },
  { v: "prospeccion", n: "Prospección / búsqueda de obras", g: "Trabajo interno", externo: false },
  { v: "reunion_interna", n: "Reunión interna", g: "Trabajo interno", externo: false },
  { v: "administrativo", n: "Gestión administrativa", g: "Trabajo interno", externo: false },
  { v: "desplazamiento", n: "Desplazamiento", g: "Desplazamientos", externo: false },
  { v: "nota", n: "Nota", g: "Trabajo interno", externo: false },
];
export const tipoNombre = (v: string) => TIPOS_ACT.find((t) => t.v === v)?.n ?? v;
export const GRUPOS_ACT = ["Visitas y reuniones", "Llamadas y emails", "Ofertas", "Trabajo interno", "Desplazamientos"];
export const GRUPO_COLOR: Record<string, string> = {
  "Visitas y reuniones": "#1F3864", "Llamadas y emails": "#2E75B6", "Ofertas": "#C55A11", "Trabajo interno": "#7F7F7F", "Desplazamientos": "#BF9000",
};
export const DURACIONES = [15, 30, 45, 60, 90, 120, 180, 240];
export const horas = (min: number | null | undefined) => {
  const m = Math.round(Number(min ?? 0));
  if (!m) return "0 h";
  const h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`;
};
export const ROLES = ["admin", "direccion", "comercial", "estudios", "ingenieria", "finanzas", "lectura"];
export const TIPOS_EMPRESA = ["constructora", "promotora", "ingenieria", "pm", "operador", "competidor", "otro"];
export const GO_NOGO = [
  { k: "decisor", n: "Decisor identificado (nombre y cargo)" },
  { k: "fecha", n: "Adjudicación prevista antes del 31/01/2027 (o justificada)" },
  { k: "ticket", n: "Ticket entre 0,5 y 5 M€ o aprobado por Dirección" },
  { k: "cliente", n: "Cliente solvente (informe revisado)" },
  { k: "pago", n: "Pago ≤ 90 días o con confirming" },
  { k: "garantias", n: "Retenciones/avales aceptables (Finanzas)" },
  { k: "capacidad", n: "Capacidad de equipo confirmada (Producción/RRHH)" },
];
export const PRIO_COLOR: Record<string, string> = {
  P1: "bg-orange-200 text-orange-900", P2: "bg-yellow-200 text-yellow-900", P3: "bg-green-100 text-green-900", Fuera: "bg-slate-200 text-slate-700",
};
export const OBJETIVO_MEUR = 20;

/** Estados de seguimiento usados por el equipo (Excel BDD Contactos Obras). */
export const ESTADOS_SEGUIMIENTO = [
  "Nos interesa (especial atención)", "Agendar llamada", "Envío de correo", "Las lleva JC",
  "No se ha hecho pública la contratista", "No hay suficiente información", "Proceso finalizado",
];
/** Estado de la documentación del proyecto (planos/mediciones para ofertar). */
export const ESTADOS_DOC = ["Pendiente", "Entregada", "Aplazada", "Descartada"];
export const DOC_COLOR: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-900", Entregada: "bg-green-100 text-green-900",
  Aplazada: "bg-blue-100 text-blue-900", Descartada: "bg-slate-200 text-slate-700",
};
export const ORIGENES = ["Investigación plan comercial", "BDD Contactos Obras", "Investigación plan comercial + BDD Contactos Obras", "Licitación pública", "Otro"];
