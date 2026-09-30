# CRM Comercial Tecmelec

Aplicación web (Next.js 14 + Supabase) para ejecutar el plan comercial de 20 M€: oportunidades, empresas y contactos, registro rápido de actividad desde el móvil (con foto), panel de dirección, plan semanal real/objetivo y alertas diarias de licitaciones.

Base de datos: proyecto Supabase **Portal Compras**, tablas con prefijo `crm_` (no toca las tablas existentes). Se entra con el mismo usuario y contraseña del Portal Compras, pero solo quien esté dado de alta en `crm_usuarios` ve datos.

## Publicar en Vercel

1. Crea un repositorio en GitHub (p. ej. `tecmelec-crm-comercial`) y sube esta carpeta (ya es un repositorio git con un primer commit):
   ```bash
   git remote add origin https://github.com/<tu-usuario>/tecmelec-crm-comercial.git
   git push -u origin main
   ```
2. En Vercel: **Add New → Project → Import** el repositorio. Framework: Next.js (se detecta solo).
3. Variables de entorno (Settings → Environment Variables):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://oappnsquhmgccjnlistx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_JkKX46ZguA4w99u_tHMZFw_xGOCW9dM` |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(opcional)* clave service_role → solo para crear usuarios nuevos desde la pantalla Usuarios. Nunca con prefijo `NEXT_PUBLIC_`. |

4. Deploy. Entra con `elugo@tecmelec.es` (ya dado de alta como admin).

## Emails de alertas de licitaciones (opcional)

La función ya se ejecuta cada día laborable a las 8:00 y guarda los resultados en la pantalla «Licitaciones». Para recibirlos también por email:
1. Crea una cuenta en https://resend.com y obtén una API key (verifica el dominio tecmelec.es para enviar desde una dirección propia).
2. Supabase → Edge Functions → Secrets: añade `RESEND_API_KEY` y, si verificaste dominio, `ALERTAS_FROM` (p. ej. `CRM Tecmelec <crm@tecmelec.es>`).
3. El destinatario está en la tabla `crm_config`, clave `email_alertas` (ahora: elugo@tecmelec.es).

## Pantallas

- **Panel**: contratado, adjudicado, ofertado vivo, pipeline ponderado, avance hacia 20 M€, KPIs de la semana frente al plan, acciones vencidas.
- **Oportunidades**: 135 obras (37 de la investigación del plan + 98 de la BDD de contactos de obras), filtros por prioridad, etapa, estado de seguimiento, documentación y origen; botón «Seguimientos vencidos»; ficha editable con seguimiento, go/no-go, cifras, contactos de la obra e historial.
- **+ Registrar**: formulario para el móvil (llamada, visita, reunión, RFQ, oferta…) con foto.
- **Empresas**: 198 constructoras, promotoras, ingenierías, PM, operadores y competidores; teléfono/email general; oportunidades como constructora o como promotor.
- **Contactos**: directorio de 85 contactos con búsqueda y llamada/email con un toque.
- **Licitaciones**: detectadas automáticamente; botón «Crear oportunidad».
- **Plan semanal**: 19 semanas (23/09/2026 → 31/01/2027), real frente a objetivo.
- **Usuarios** (admin/dirección): alta de usuarios y roles.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```
