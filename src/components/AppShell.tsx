// src/components/AppShell.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Home, FileText, CreditCard, Settings } from "lucide-react";
import UserMenu from "@/components/ui/UserMenu";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  // Pequeño guard de sesión por token en cliente
  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-950 text-neutral-200">
        <div className="animate-pulse text-sm opacity-80">Cargando…</div>
      </div>
    );
  }

  const links = [
    { href: "/dashboard", label: "Inicio", icon: <Home className="h-4 w-4" /> },
    { href: "/dashboard/solicitudes", label: "Solicitudes", icon: <FileText className="h-4 w-4" /> },
    { href: "/dashboard/pagos", label: "Pagos", icon: <CreditCard className="h-4 w-4" /> },
    { href: "/dashboard/configuracion", label: "Configuración", icon: <Settings className="h-4 w-4" /> },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const currentLabel =
    links.find((l) => isActive(l.href))?.label ?? "Panel";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Topbar */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-white/10 bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Drawer trigger (móvil) */}
            <button
              className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 hover:bg-white/5 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand */}
            <Link href="/dashboard" className="font-semibold">
              Empeños<span className="text-blue-400">GT</span>
            </Link>

            {/* Breadcrumb simple */}
            <span className="ml-3 hidden text-sm text-neutral-400 sm:inline">
              {currentLabel}
            </span>
          </div>

          {/* Perfil (modal) */}
          <div className="flex items-center gap-2">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Layout grid */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[240px_1fr] gap-0 px-4 pt-16">
        {/* Sidebar desktop */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] lg:block">
          <nav className="space-y-1">
            {links.map(({ href, label, icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition
                    ${active ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5"}`}
                >
                  {icon}
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Contenido */}
        <main className="min-h-[calc(100vh-4rem)] py-6 lg:pl-6">
          {children}
        </main>
      </div>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-neutral-950 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold">
                Empeños<span className="text-blue-400">GT</span>
              </div>
              <button
                className="rounded-lg border border-white/10 p-2 hover:bg-white/5"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {links.map(({ href, label, icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition
                      ${active ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5"}`}
                  >
                    {icon}
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
