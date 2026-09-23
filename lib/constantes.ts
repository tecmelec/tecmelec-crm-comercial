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
export const TIPOS_ACT = [
  { v: "llamada", n: "Llamada" }, { v: "email", n: "Email" }, { v: "linkedin", n: "LinkedIn" },
  { v: "reunion", n: "Reunión" }, { v: "visita", n: "Visita de obra" }, { v: "rfq", n: "RFQ recibida" },
  { v: "oferta", n: "Oferta presentada" }, { v: "negociacion", n: "Negociación" }, { v: "adjudicacion", n: "Adjudicación" },
  { v: "nota", n: "Nota" },
];
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
