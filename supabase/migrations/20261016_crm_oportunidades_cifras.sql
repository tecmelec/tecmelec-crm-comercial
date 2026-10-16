-- Nuevos campos del bloque «Cifras» de la oportunidad.
-- Los porcentajes (pct_electrico, pct_captable, prob_adjudicacion) siguen guardándose como 0–1;
-- la pantalla los muestra y los pide de 0 a 100.
alter table public.crm_oportunidades
  add column if not exists num_oferta text,
  add column if not exists fecha_inicio_aprox date,
  add column if not exists plazo_ejecucion_meses numeric(6,2) check (plazo_ejecucion_meses is null or plazo_ejecucion_meses >= 0);

comment on column public.crm_oportunidades.num_oferta is 'Número de oferta';
comment on column public.crm_oportunidades.fecha_inicio_aprox is 'Fecha aproximada de inicio de la obra';
comment on column public.crm_oportunidades.plazo_ejecucion_meses is 'Tiempo de ejecución en meses';

notify pgrst, 'reload schema';
