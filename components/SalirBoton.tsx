"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function SalirBoton() {
  return (
    <button className="text-xs underline" onClick={async () => { await supabaseBrowser().auth.signOut(); window.location.href = "/login"; }}>
      Salir
    </button>
  );
}
