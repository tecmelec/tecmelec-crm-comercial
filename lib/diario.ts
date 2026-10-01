/** Campos de actividad con empresa, obra y personas (para diario, informes e historiales). */
export const SELECT_ACT =
  "*, oportunidad:crm_oportunidades!crm_actividades_oportunidad_id_fkey(id,codigo,proyecto), empresa:crm_empresas!crm_actividades_empresa_id_fkey(id,nombre), personas:crm_actividad_contactos(nuevo, contacto:crm_contactos(id,nombre,cargo))";
