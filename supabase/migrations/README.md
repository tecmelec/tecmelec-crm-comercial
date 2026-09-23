Las migraciones ya están aplicadas en el proyecto Supabase «Portal Compras» (oappnsquhmgccjnlistx):

1. `crm_comercial_init` – tablas crm_* (usuarios, empresas, contactos, oportunidades, actividades, plan_semanal, licitaciones, config), funciones de permisos, RLS y bucket privado `crm-fotos`.
2. `crm_alertas_infra` – tabla `crm_secretos` (solo service_role), configuración de alertas, extensiones pg_net y pg_cron.
3. `crm_rpc_alta_usuario` – RPC `crm_alta_usuario(email, nombre, rol)` para dar de alta usuarios existentes (solo admin/direccion).
4. `crm_pg_net_schema_extensions` – pg_net movido al esquema `extensions`.

Tarea programada (pg_cron): `crm-alertas-licitaciones-diario`, lunes a viernes 06:00 UTC (08:00 Madrid), llama a la Edge Function `crm-alertas-licitaciones`.

No se ha modificado ninguna tabla existente del Portal Compras.
