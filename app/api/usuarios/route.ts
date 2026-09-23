import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSesion } from "@/lib/supabase/server";
import { ROLES } from "@/lib/constantes";

/** Crea un usuario nuevo de Supabase Auth y lo da de alta en el CRM. Solo admin/direccion. Requiere SUPABASE_SERVICE_ROLE_KEY. */
export async function POST(req: Request) {
  const { perfil } = await getSesion();
  if (!perfil || !["admin", "direccion"].includes(perfil.rol)) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  const { email, nombre, rol, password } = await req.json();
  if (!email || !nombre || !ROLES.includes(rol) || !password || String(password).length < 8)
    return NextResponse.json({ ok: false, error: "Datos incompletos (contraseña mínima 8 caracteres)" }, { status: 400 });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre } });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  const { error: e2 } = await admin.from("crm_usuarios").insert({ user_id: data.user.id, nombre, email: String(email).toLowerCase(), rol });
  if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
