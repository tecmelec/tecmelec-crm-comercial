-- Diario de actividades: duración, hora, más tipos y varias personas por actividad. Solo tablas crm_.
alter table public.crm_actividades
  add column if not exists duracion_min integer check (duracion_min is null or duracion_min between 0 and 1440),
  add column if not exists hora_inicio time,
  add column if not exists updated_at timestamptz not null default now();
alter table public.crm_actividades drop constraint if exists crm_actividades_tipo_check;
alter table public.crm_actividades add constraint crm_actividades_tipo_check check (tipo = any (array[
  'llamada','email','linkedin','reunion','videollamada','visita','rfq','elaboracion_oferta','oferta',
  'negociacion','adjudicacion','reunion_interna','prospeccion','desplazamiento','administrativo','nota']));
drop trigger if exists crm_actividades_touch on public.crm_actividades;
create trigger crm_actividades_touch before update on public.crm_actividades for each row execute function public.crm_touch();
create index if not exists crm_act_fecha_idx on public.crm_actividades(fecha);
create index if not exists crm_act_usuario_fecha_idx on public.crm_actividades(usuario_id, fecha);
drop policy if exists crm_actividades_upd on public.crm_actividades;
create policy crm_actividades_upd on public.crm_actividades for update
  using ((select public.crm_es_admin()) or (usuario_id = (select auth.uid()) and (select public.crm_puede_editar())))
  with check ((select public.crm_es_admin()) or (usuario_id = (select auth.uid()) and (select public.crm_puede_editar())));
drop policy if exists crm_actividades_del on public.crm_actividades;
create policy crm_actividades_del on public.crm_actividades for delete
  using ((select public.crm_es_admin()) or (usuario_id = (select auth.uid()) and (select public.crm_puede_editar())));
create table if not exists public.crm_actividad_contactos (
  actividad_id uuid not null references public.crm_actividades(id) on delete cascade,
  contacto_id uuid not null references public.crm_contactos(id) on delete cascade,
  nuevo boolean not null default false,
  primary key (actividad_id, contacto_id));
create index if not exists crm_actcon_contacto_idx on public.crm_actividad_contactos(contacto_id);
alter table public.crm_actividad_contactos enable row level security;
create or replace function public.crm_actividad_es_mia(p_act uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select public.crm_es_admin() or exists (
    select 1 from public.crm_actividades a where a.id = p_act and a.usuario_id = auth.uid()) and public.crm_puede_editar();
$$;
revoke execute on function public.crm_actividad_es_mia(uuid) from anon, public;
grant execute on function public.crm_actividad_es_mia(uuid) to authenticated;
create policy crm_actcon_sel on public.crm_actividad_contactos for select using ((select public.crm_es_miembro()));
create policy crm_actcon_ins on public.crm_actividad_contactos for insert with check (public.crm_actividad_es_mia(actividad_id));
create policy crm_actcon_del on public.crm_actividad_contactos for delete using (public.crm_actividad_es_mia(actividad_id));
