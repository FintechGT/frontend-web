"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Mail, Settings, User } from "lucide-react";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useAuth } from "@/app/AppLayoutClient";

/* =========================================================================
   Tipo de usuario mínimo para esta vista
   -------------------------------------------------------------------------
   - Se define el shape esperado de /usuarios/me para tipar el estado `me`.
   ========================================================================= */
type Usuario = {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
};

/* =========================================================================
   Helper para iniciales del usuario
   -------------------------------------------------------------------------
   - Si hay nombre, toma hasta dos iniciales.
   - Si no, usa la primera letra del correo o "U".
   ========================================================================= */
function getInitials(nombre?: string, correo?: string): string {
  if (nombre && nombre.trim()) {
    return nombre
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (correo) return correo[0]?.toUpperCase() ?? "U";
  return "U";
}

/* =========================================================================
   Componente: UserMenu
   -------------------------------------------------------------------------
   - Renderiza un botón con las iniciales del usuario y abre un modal.
   - En el modal se muestran datos básicos y accesos a secciones de perfil.
   - El cierre de sesión limpia storage y delega en `useAuth().logout()`.
   - Se eliminó `useRouter` para evitar warnings de variable no usada.
   ========================================================================= */
export default function UserMenu(): React.ReactElement{
  const { logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [me, setMe] = React.useState<Usuario | null>(null);

  // Efecto de carga de datos del usuario autenticado
  React.useEffect(() => {
    let alive = true;
    api
      .get("/usuarios/me")
      .then((r) => {
        if (!alive) return;
        setMe(r.data as Usuario);
      })
      .catch(() => {
        // Se silencia error porque el menú es complementario; la app principal maneja auth.
      });
    return () => {
      alive = false;
    };
  }, []);

  const initials = getInitials(me?.nombre, me?.correo);

  // Maneja el cierre de sesión con limpieza total y redirección dura
  function handleLogout(): void {
    localStorage.clear();
    logout();
    window.location.href = "/login";
  }

  return (
    <>
      {/* Botón que abre el modal del usuario */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
        aria-haspopup="dialog"
      >
        <div className="grid size-7 place-items-center rounded-full bg-blue-600 text-xs font-bold">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <div className="text-xs text-neutral-400">Usuario</div>
          <div className="text-xs">{me?.correo || "mi@correo.com"}</div>
        </div>
      </button>

      {/* Modal con datos y acciones */}
      <Modal open={open} onClose={() => setOpen(false)} title="Tu cuenta">
        {/* Encabezado con avatar e info básica */}
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-blue-600 text-sm font-bold">
            {initials}
          </div>
          <div>
            <div className="font-medium">{me?.nombre || "Usuario"}</div>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Mail className="size-4" />
              <span>{me?.correo || "mi@correo.com"}</span>
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="mt-4 grid gap-2">
          <Link
            href="/dashboard/perfil"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            <User className="size-4" />
            <span>Ver perfil</span>
          </Link>

          <Link
            href="/dashboard/perfil/editar"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4" />
            <span>Editar perfil</span>
          </Link>

          <Link
            href="/dashboard/configuracion"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4" />
            <span>Configuración</span>
          </Link>
        </div>

        {/* Botón de cierre de sesión */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-500"
          >
            <LogOut className="size-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </Modal>
    </>
  );
}

