"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Eliminar una oportunidad (solo administradores; la base de datos también lo impide al resto). */
export default function EliminarOportunidad({ id, codigo, proyecto }: { id: string; codigo: string; proyecto: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  async function eliminar() {
    const txt = prompt(
      `Vas a ELIMINAR la oportunidad ${codigo} · ${proyecto}.\n\n` +
      `Se borrará definitivamente con su historial de etapas. Las actividades registradas en los diarios se conservan (quedan sin proyecto asociado).\n\n` +
      `Para confirmar, escribe el código ${codigo}:`);
    if (txt == null) return;
    if (txt.trim().toUpperCase() !== codigo.toUpperCase()) { alert("El código no coincide. No se ha eliminado nada."); return; }
    setOcupado(true);
    const { data, error } = await supabaseBrowser().from("crm_oportunidades").delete().eq("id", id).select("id");
    setOcupado(false);
    if (error) return alert("No se pudo eliminar: " + error.message);
    if (!data?.length) return alert("No tienes permiso para eliminar oportunidades (solo administradores).");
    router.push("/oportunidades");
    router.refresh();
  }
  return (
    <button className="btn-sec border-red-300 text-red-700 hover:bg-red-50" onClick={eliminar} disabled={ocupado}>
      {ocupado ? "Eliminando…" : "Eliminar oportunidad"}
    </button>
  );
}
