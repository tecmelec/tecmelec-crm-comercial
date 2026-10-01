import Link from "next/link";
import { getSesion } from "@/lib/supabase/server";
import SinAcceso from "@/components/SinAcceso";
import DiarioForm from "@/components/DiarioForm";
import Timeline from "@/components/Timeline";
import ResumenTiempos from "@/components/ResumenTiempos";
import { firmarFotos } from "@/lib/fotos";
import { SELECT_ACT } from "@/lib/diario";
import { hoyMadrid, inicioDia, sumarDias, fechaLarga, esDia } from "@/lib/tz";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { fecha?: string; u?: string } }) {
  const { sb, user, perfil } = await getSesion();
  if (!perfil || !user) return <SinAcceso />;
  const esAdmin = ["admin", "direccion"].includes(perfil.rol);
  const dia = esDia(searchParams.fecha) ? searchParams.fecha! : hoyMadrid();
  const uid = esAdmin && searchParams.u ? searchParams.u : user.id;
  const [{ data: acts }, { data: usuarios }] = await Promise.all([
    sb.from("crm_actividades").select(SELECT_ACT).eq("usuario_id", uid)
      .gte("fecha", inicioDia(dia).toISOString()).lt("fecha", inicioDia(sumarDias(dia, 1)).toISOString()).order("fecha"),
    sb.from("crm_usuarios").select("user_id,nombre,rol,activo").order("nombre"),
  ]);
  const fotos = await firmarFotos(sb, acts ?? []);
  const quien = usuarios?.find((u) => u.user_id === uid)?.nombre ?? perfil.nombre;
  const propio = uid === user.id;
  const url = (d: string) => `/diario?fecha=${d}${uid !== user.id ? `&u=${uid}` : ""}`;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-bold text-navy">{propio ? "Mi diario" : `Diario de ${quien}`} · <span className="capitalize">{fechaLarga(dia)}</span></h1>
        <Link className="btn-sec" href={url(sumarDias(dia, -1))}>← Día anterior</Link>
        <Link className="btn-sec" href={url(hoyMadrid())}>Hoy</Link>
        <Link className="btn-sec" href={url(sumarDias(dia, 1))}>Día siguiente →</Link>
        <form className="flex gap-1" action="/diario">
          <input type="date" name="fecha" defaultValue={dia} className="inp w-40" />
          {esAdmin && (
            <select name="u" defaultValue={uid} className="inp w-44">
              {(usuarios ?? []).filter((u) => u.activo).map((u) => <option key={u.user_id} value={u.user_id}>{u.nombre}</option>)}
            </select>
          )}
          <button className="btn-sec">Ver</button>
        </form>
      </div>
      <div className="card"><ResumenTiempos acts={acts ?? []} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        {propio && perfil.rol !== "lectura" && (
          <div className="space-y-2">
            <h2 className="font-bold text-navy">Registrar actividad</h2>
            <DiarioForm fecha={dia} />
          </div>
        )}
        <div className={`space-y-2 ${propio ? "" : "lg:col-span-2"}`}>
          <h2 className="flex font-bold text-navy">Actividades del día ({acts?.length ?? 0})
            <Link className="ml-auto text-sm font-normal underline" href={`/informes?desde=${dia}&hasta=${dia}${esAdmin ? "" : ""}`}>Informe del día</Link></h2>
          <Timeline acts={acts ?? []} usuarios={usuarios ?? []} fotos={fotos} usuarioId={user.id} esAdmin={esAdmin} soloHora />
        </div>
      </div>
    </div>
  );
}
