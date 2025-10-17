// src/app/(app)/dashboard/usuarios/page.tsx
"use client";

import * as React from "react";
import {
  listAdminUsuarios,
  type AdminUsuario,
  patchEstadoUsuario,
  resetearPasswordUsuario,
} from "@/app/services/adminUsuarios";
import ActividadDrawer from "./ActividadDrawer";
import UsuarioRolesModal from "./UsuarioRolesModal";
import Link from "next/link";
import { RotateCw, Search, ShieldCheck, UserMinus, UserRound } from "lucide-react";

export default function UsuariosAdminPage() {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<AdminUsuario[]>([]);

  // Drawer actividad
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [drawerUser, setDrawerUser] = React.useState<{ id: number; nombre: string } | null>(null);

  // Modal roles
  const [openRoles, setOpenRoles] = React.useState(false);
  const [rolesUser, setRolesUser] = React.useState<{ id: number; nombre: string; correo: string } | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const r = await listAdminUsuarios({ q: q || undefined, limit: 20, offset: 0, sort: "fecha_alta", dir: "desc" });
      setRows(r.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onToggleEstado(u: AdminUsuario) {
    const nuevo = !u.estado_activo;
    await patchEstadoUsuario(u.id, nuevo);
    setRows((prev) => prev.map((x) => (x.id === u.id ? { ...x, estado_activo: nuevo } : x)));
  }

  async function onResetPassword(u: AdminUsuario) {
    const motivo = prompt(`Motivo para resetear password de ${u.nombre}:`, "");
    if (motivo === null) return;
    await resetearPasswordUsuario(u.id, motivo || "");
    alert("Contraseña reseteada. El usuario deberá cambiarla al volver a iniciar sesión.");
  }

  function onVerActividad(u: AdminUsuario) {
    setDrawerUser({ id: u.id, nombre: u.nombre });
    setOpenDrawer(true);
  }

  function onAbrirRoles(u: AdminUsuario) {
    setRolesUser({ id: u.id, nombre: u.nombre, correo: u.correo });
    setOpenRoles(true);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <ShieldCheck className="size-5" />
          Usuarios (Admin)
        </h1>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <RotateCw className="size-4" />
          Refrescar
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-2 top-2.5 size-4 text-neutral-400" />
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-8 pr-3 text-sm outline-none"
            placeholder="Buscar por nombre o correo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") refresh();
            }}
          />
        </div>
        <button onClick={refresh} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
          Buscar
        </button>
      </div>

      {loading ? (
        <div className="text-neutral-300 flex items-center gap-2">
          <RotateCw className="size-4 animate-spin" /> Cargando usuarios…
        </div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-100">
              <tr>
                <th className="p-2 text-left">Usuario</th>
                <th className="p-2 text-left hidden md:table-cell">Correo</th>
                <th className="p-2 text-left">Roles</th>
                <th className="p-2 text-left hidden sm:table-cell">Estado</th>
                <th className="p-2 text-left hidden lg:table-cell">Alta</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="p-2">
                    <div className="font-medium flex items-center gap-2">
                      <UserRound className="size-4" />
                      {u.nombre}
                    </div>
                    <div className="text-xs text-neutral-400 md:hidden">{u.correo}</div>
                  </td>
                  <td className="p-2 hidden md:table-cell">{u.correo}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {(u.roles ?? []).map((r) => (
                        <span key={r} className="rounded bg-white/10 px-2 py-0.5 text-xs">
                          {r}
                        </span>
                      ))}
                      {(!u.roles || u.roles.length === 0) && (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 hidden sm:table-cell">
                    <button
                      onClick={() => onToggleEstado(u)}
                      className={`rounded px-2 py-1 text-xs ${
                        u.estado_activo
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-neutral-700 hover:bg-neutral-600"
                      }`}
                      title="Activar / Desactivar"
                    >
                      {u.estado_activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="p-2 hidden lg:table-cell">
                    {u.fecha_alta ? new Date(u.fecha_alta).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/usuarios/${u.id}`}
                        className="rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                        title="Ver usuario"
                      >
                        Ver usuario
                      </Link>

                      <button
                        onClick={() => onVerActividad(u)}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs hover:bg-indigo-500"
                      >
                        Actividad
                      </button>
                      <button
                        onClick={() => onResetPassword(u)}
                        className="inline-flex items-center gap-1 rounded bg-rose-600 px-2 py-1 text-xs hover:bg-rose-500"
                        title="Resetear password"
                      >
                        <UserMinus className="size-3.5" /> Reset
                      </button>
                      <button
                        onClick={() => onAbrirRoles(u)}
                        className="rounded bg-sky-600 px-2 py-1 text-xs hover:bg-sky-500"
                        title="Ver / asignar roles"
                      >
                        Roles
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-neutral-400" colSpan={6}>
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer de auditoría */}
      <ActividadDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        userId={drawerUser?.id ?? null}
        userName={drawerUser?.nombre}
      />

      {/* Modal de roles */}
      <UsuarioRolesModal
        open={openRoles}
        onClose={() => setOpenRoles(false)}
        userId={rolesUser?.id ?? null}
        userName={rolesUser?.nombre}
        userEmail={rolesUser?.correo}
      />
    </div>
  );
}
