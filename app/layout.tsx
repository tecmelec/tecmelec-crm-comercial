import "./globals.css";
import Link from "next/link";
import { getSesion } from "@/lib/supabase/server";
import SalirBoton from "@/components/SalirBoton";

export const metadata = { title: "CRM Comercial Tecmelec", description: "Pipeline comercial 20 M€" };
export const viewport = { width: "device-width", initialScale: 1 };

const NAV = [
  { href: "/", n: "Panel" },
  { href: "/oportunidades", n: "Oportunidades" },
  { href: "/registrar", n: "+ Registrar" },
  { href: "/empresas", n: "Empresas" },
  { href: "/licitaciones", n: "Licitaciones" },
  { href: "/plan", n: "Plan semanal" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, perfil } = await getSesion();
  return (
    <html lang="es">
      <body>
        {user && (
          <header className="bg-navy text-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
              <span className="font-bold">CRM Comercial</span>
              {perfil && NAV.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm hover:underline">{l.n}</Link>
              ))}
              {perfil && ["admin", "direccion"].includes(perfil.rol) && (
                <Link href="/usuarios" className="text-sm hover:underline">Usuarios</Link>
              )}
              <span className="ml-auto text-xs opacity-80">{perfil?.nombre ?? user.email}</span>
              <SalirBoton />
            </div>
          </header>
        )}
        <main className="mx-auto max-w-7xl px-4 py-4">{children}</main>
      </body>
    </html>
  );
}
