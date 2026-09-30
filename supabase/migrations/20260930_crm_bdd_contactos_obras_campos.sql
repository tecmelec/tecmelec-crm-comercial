-- Campos para integrar la BDD de contactos de obras (Excel) en el CRM. Solo tablas crm_.
alter table public.crm_oportunidades
  add column if not exists direccion text,
  add column if not exists estado_seguimiento text,
  add column if not exists estado_documentacion text,
  add column if not exists fecha_ultimo_contacto date,
  add column if not exists origen text,
  add column if not exists gestionado_por text,
  add column if not exists promotor_id uuid references public.crm_empresas(id) on delete set null;
alter table public.crm_empresas
  add column if not exists telefono text,
  add column if not exists email text;
create index if not exists crm_opp_estado_seg_idx on public.crm_oportunidades(estado_seguimiento);
create index if not exists crm_opp_origen_idx on public.crm_oportunidades(origen);
create index if not exists crm_opp_promotor_idx on public.crm_oportunidades(promotor_id);
