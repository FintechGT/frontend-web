"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, Settings, User } from "lucide-react";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { clearToken } from "@/app/services/auth";

type Usuario = {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
};

function getInitials(nombre?: string, correo?: string) {
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

export default function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [me, setMe] = React.useState<Usuario | null>(null);

  // Cargar datos del usuario desde /usuarios/me (el que trae nombre/correo/teléfono/dirección)
  React.useEffect(() => {
    let alive = true;
    api
      .get("/usuarios/me")
      .then((r) => {
        if (!alive) return;
        setMe(r.data as Usuario);
      })
      .catch(() => {
        /* silencioso: si falla, se queda en null y se muestran placeholders */
      });
    return () => {
      alive = false;
    };
  }, []);

  const initials = getInitials(me?.nombre, me?.correo);

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <>
      {/* Botón en la topbar */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
        aria-haspopup="dialog"
      >
        <div className="grid size-7 place-items-center rounded-full bg-blue-600 text-xs font-bold">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs text-neutral-400">Usuario</div>
          <div className="text-xs">{me?.correo || "mi@correo.com"}</div>
        </div>
      </button>

      {/* Modal con acciones */}
      <Modal open={open} onClose={() => setOpen(false)} title="Tu cuenta">
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

        <div className="mt-4 grid gap-2">
          <a
            href="/dashboard/perfil"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            <User className="size-4" /> Ver perfil
          </a>
          <a
            href="/dashboard/perfil/editar"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4" /> Editar perfil
          </a>
          <a
            href="/dashboard/configuracion"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4" /> Configuración
          </a>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-500"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </div>
      </Modal>
    </>
  );
}
