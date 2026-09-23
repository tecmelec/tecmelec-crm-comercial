// Alertas diarias de licitaciones (Plataforma de Contratación del Sector Público – datos abiertos ATOM)
// Filtra obras en Madrid, C. Valenciana, Guadalajara y Toledo con CPV de interés e importe mínimo,
// guarda en crm_licitaciones (sin duplicados) y envía resumen por email si RESEND_API_KEY está configurada.
import { createClient } from "npm:@supabase/supabase-js@2";

const FEEDS = [
  "https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom",
  "https://contrataciondelestado.es/sindicacion/sindicacion_1044/PlataformasAgregadasSinMenores.atom",
];
const MAX_PAGINAS = 4; // por feed (cada página ~500 entradas)

const CPV_INTERES: [string, string][] = [
  ["4531", "Instalación eléctrica"],
  ["4533", "Fontanería/climatización (MEP)"],
  ["45215", "Edificio sanitario / social"],
  ["452151", "Hospital / centro sanitario"],
  ["45212", "Edificio ocio / hotel / deportivo"],
  ["45213", "Edificio comercial / oficinas"],
  ["45214", "Edificio educativo / universidad"],
  ["45216", "Edificio institucional"],
  ["45454", "Reestructuración / rehabilitación"],
  ["45453", "Reforma / renovación"],
  ["45210000", "Construcción de edificios"],
  ["45000000", "Obras de construcción"],
];

const ESTADOS: Record<string, string> = {
  PRE: "Anuncio previo", PUB: "En plazo", EV: "Pendiente de adjudicación", ADJ: "Adjudicada",
  RES: "Resuelta / formalizada", ANUL: "Anulada",
};

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<(?:[\\w-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`));
  return m ? m[1].trim() : null;
};
const tags = (xml: string, name: string) =>
  [...xml.matchAll(new RegExp(`<(?:[\\w-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, "g"))].map((m) => m[1].trim());
const decode = (s: string | null) =>
  s == null ? null : s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");

type Lic = Record<string, unknown>;

function parseEntry(e: string, nuts: string[], minImporte: number): Lic | null {
  const tipo = tag(e, "TypeCode");
  if (tipo && tipo !== "3") return null; // 3 = Obras
  const codes = tags(e, "CountrySubentityCode");
  const lugarTxt = decode(tag(e, "CountrySubentity")) ?? "";
  const enZona = codes.some((c) => nuts.some((n) => c.startsWith(n))) ||
    /madrid|valencia|val[eè]ncia|alicante|castell[oó]n|guadalajara|toledo/i.test(lugarTxt);
  if (!enZona) return null;
  const cpvs = tags(e, "ItemClassificationCode");
  const motivos = CPV_INTERES.filter(([p]) => cpvs.some((c) => c.startsWith(p))).map(([, m]) => m);
  if (motivos.length === 0) return null;
  const importeTxt = tag(e, "TaxExclusiveAmount") ?? tag(e, "EstimatedOverallContractAmount") ?? tag(e, "TotalAmount");
  const importe = importeTxt ? Number(importeTxt) : null;
  const esElectrica = cpvs.some((c) => c.startsWith("4531"));
  if (importe != null && importe < (esElectrica ? minImporte / 4 : minImporte)) return null;
  const id = tag(e, "id");
  if (!id) return null;
  const linkM = e.match(/<link[^>]*href="([^"]+)"/);
  const estado = tag(e, "ContractFolderStatusCode");
  const endDate = tag(e, "EndDate");
  return {
    fuente: "PLACSP",
    external_id: id,
    titulo: decode(tag(e, "title")) ?? "(sin título)",
    organo: decode(tag(e, "Name")),
    importe_eur: importe,
    lugar: lugarTxt || codes.join(", "),
    cpv: [...new Set(cpvs)].join(", "),
    tipo_contrato: "Obras",
    estado_licitacion: estado ? (ESTADOS[estado] ?? estado) : null,
    fecha_publicacion: tag(e, "updated"),
    fecha_limite: endDate ? `${endDate}T23:59:00+02:00` : null,
    url: linkM ? decode(linkM[1]) : null,
    motivo: motivos.join(" · ") + (estado === "ADJ" || estado === "RES" ? " · ADJUDICADA: oportunidad de subcontratación" : ""),
  };
}

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: sec } = await supabase.from("crm_secretos").select("valor").eq("clave", "cron_secret").single();
  if (!sec || req.headers.get("x-cron-secret") !== sec.valor) {
    return new Response(JSON.stringify({ error: "no autorizado" }), { status: 401 });
  }
  const { data: cfg } = await supabase.from("crm_config").select("clave,valor");
  const conf = Object.fromEntries((cfg ?? []).map((r) => [r.clave, r.valor]));
  const nuts: string[] = conf.alertas_nuts ?? ["ES30", "ES52", "ES424", "ES425"];
  const minImporte = Number(conf.alertas_min_importe_eur ?? 1000000);
  const desde = conf.alertas_ultima_ejecucion ? new Date(conf.alertas_ultima_ejecucion) : new Date(Date.now() - 3 * 86400000);

  const encontrados: Lic[] = [];
  const errores: string[] = [];
  let leidas = 0;
  for (const feed of FEEDS) {
    let url: string | null = feed;
    for (let p = 0; p < MAX_PAGINAS && url; p++) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Tecmelec-CRM/1.0" } });
        if (!res.ok) { errores.push(`${url}: HTTP ${res.status}`); break; }
        const xml = await res.text();
        const entries = xml.split(/<entry[\s>]/).slice(1);
        leidas += entries.length;
        let masAntiguo = new Date();
        for (const e of entries) {
          const up = tag(e, "updated");
          if (up) { const d = new Date(up); if (d < masAntiguo) masAntiguo = d; }
          const lic = parseEntry(e, nuts, minImporte);
          if (lic) encontrados.push(lic);
        }
        const next = xml.match(/<link[^>]*rel="next"[^>]*href="([^"]+)"/) ?? xml.match(/<link[^>]*href="([^"]+)"[^>]*rel="next"/);
        url = next && masAntiguo > desde ? next[1] : null;
      } catch (err) {
        errores.push(`${url}: ${(err as Error).message}`);
        break;
      }
    }
  }

  // de-duplicar por external_id y quedarse con la versión más reciente
  const porId = new Map<string, Lic>();
  for (const l of encontrados) porId.set(l.external_id as string, l);
  const filas = [...porId.values()];
  let nuevas: Lic[] = [];
  if (filas.length) {
    const ids = filas.map((f) => f.external_id as string);
    const { data: exist } = await supabase.from("crm_licitaciones").select("external_id").in("external_id", ids);
    const ya = new Set((exist ?? []).map((r) => r.external_id));
    nuevas = filas.filter((f) => !ya.has(f.external_id as string));
    const { error } = await supabase.from("crm_licitaciones").upsert(filas, { onConflict: "external_id", ignoreDuplicates: false });
    if (error) errores.push("upsert: " + error.message);
  }

  // Email opcional
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const to = conf.email_alertas;
  let email = "no configurado (falta RESEND_API_KEY)";
  if (resendKey && to && nuevas.length) {
    const html = `<h2>Nuevas licitaciones de interés (${nuevas.length})</h2><table border="1" cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px">
      <tr><th>Título</th><th>Órgano</th><th>Importe</th><th>Lugar</th><th>Estado</th><th>Motivo</th></tr>` +
      nuevas.map((n) => `<tr><td><a href="${n.url}">${n.titulo}</a></td><td>${n.organo ?? ""}</td><td>${n.importe_eur ? Number(n.importe_eur).toLocaleString("es-ES") + " €" : ""}</td><td>${n.lugar}</td><td>${n.estado_licitacion ?? ""}</td><td>${n.motivo}</td></tr>`).join("") + "</table>";
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: Deno.env.get("ALERTAS_FROM") ?? "CRM Tecmelec <onboarding@resend.dev>", to: [to], subject: `CRM: ${nuevas.length} licitaciones nuevas de interés`, html }),
    });
    email = r.ok ? "enviado" : `error ${r.status}`;
    if (r.ok) await supabase.from("crm_licitaciones").update({ notificado: true }).in("external_id", nuevas.map((n) => n.external_id as string));
  }

  await supabase.from("crm_config").upsert({ clave: "alertas_ultima_ejecucion", valor: new Date().toISOString() });
  return new Response(JSON.stringify({ leidas, coincidencias: filas.length, nuevas: nuevas.length, email, errores }), {
    headers: { "Content-Type": "application/json" },
  });
});
