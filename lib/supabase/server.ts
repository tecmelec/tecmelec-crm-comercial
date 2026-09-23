import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(list) {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* llamado desde Server Component */ }
      },
    },
  });
}

/** Devuelve el usuario y su perfil CRM (o null si no es miembro). */
export async function getSesion() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, perfil: null };
  const { data: perfil } = await sb.from("crm_usuarios").select("*").eq("user_id", user.id).eq("activo", true).maybeSingle();
  return { sb, user, perfil };
}
