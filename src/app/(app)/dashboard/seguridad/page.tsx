// src/app/(app)/dashboard/seguridad/page.tsx
"use client";

import * as React from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { usePermiso } from "@/hooks/usePermiso";
import {
  listRoles,
  listPermisos,
  listModulos,
  type Rol,
  type Permiso,
  type Modulo,
  createRol,
  updateRol,
  deleteRol,
} from "@/app/services/seguridad";
import { Plus, RotateCw, Shield, ShieldCheck, Trash2, Pencil } from "lucide-react";

/** UI util */
function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function SeguridadPage() {
  // permisos granulares
  const puedeVer = usePermiso(["seguridad.view", "roles.view", "permisos.view", "modulos.view"]);
  const puedeCrearRol = usePermiso(["roles.create"]);
  const puedeEditarRol = usePermiso(["roles.update"]);
  const puedeEliminarRol = usePermiso(["roles.delete"]);

  // estado
  const [loading, setLoading] = React.useState<boolean>(true);
  const [tab, setTab] = React.useState<"roles" | "permisos" | "modulos">("roles");

  const [roles, setRoles] = React.useState<Rol[]>([]);
  const [permisos, setPermisos] = React.useState<Permiso[]>([]);
  const [modulos, setModulos] = React.useState<Modulo[]>([]);

  const [error, setError] = React.useState<string | null>(null);

  // form rol simple
  const [nuevoRol, setNuevoRol] = React.useState<{ nombre: string; descripcion: string }>({ nombre: "", descripcion: "" });
  const [editando, setEditando] = React.useState<Rol | null>(null);

  const cargar = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [rs, ps, ms] = await Promise.all([
        listRoles({ limit: 200 }),
        listPermisos(),
        listModulos({}),
      ]);

      setRoles(Array.isArray(rs) ? rs as Rol[] : []);
      setPermisos(Array.isArray(ps) ? ps as Permiso[] : []);
      setModulos(Array.isArray(ms) ? ms as Modulo[] : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar seguridad");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void cargar(); }, [cargar]);

  async function onCrearRol() {
    if (!puedeCrearRol) return;
    const payload: Omit<Rol, "id_rol"> = {
      nombre: nuevoRol.nombre.trim(),
      descripcion: nuevoRol.descripcion.trim(),
      activo: true,
    } as unknown as Omit<Rol, "id_rol">; // para cumplir el tipo del servicio

    if (!payload.nombre) return;

    await createRol(payload as any);
    setNuevoRol({ nombre: "", descripcion: "" });
    await cargar();
  }

  async function onGuardarRol() {
    if (!puedeEditarRol || !editando) return;
    await updateRol(editando.id_rol, {
      nombre: editando.nombre,
      descripcion: editando.descripcion,
      activo: editando.activo,
    });
    setEditando(null);
    await cargar();
  }

  async function onEliminarRol(id: number) {
    if (!puedeEliminarRol) return;
    if (!confirm("¿Eliminar este rol?")) return;
    await deleteRol(id);
    await cargar();
  }

  /** Render helpers con tipado explícito para evitar any */
  const filasRoles = roles.map((r: Rol) => {
    const activoBadge = r.activo ? (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">Activo</span>
    ) : (
      <span className="rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs text-neutral-400">Inactivo</span>
    );

    return (
      <tr key={r.id_rol} className="border-t border-white/10">
        <td className="px-3 py-2">{r.nombre}</td>
        <td className="px-3 py-2 text-neutral-400">{r.descripcion ?? "—"}</td>
        <td className="px-3 py-2">{activoBadge}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            {puedeEditarRol && (
              <button
                className="rounded p-1 hover:bg-white/10"
                onClick={() => setEditando(r)}
                title="Editar"
              >
                <Pencil className="size-4" />
              </button>
            )}
            {puedeEliminarRol && (
              <button
                className="rounded p-1 text-red-400 hover:bg-red-500/10"
                onClick={() => onEliminarRol(r.id_rol)}
                title="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  });

  const filasPermisos = permisos.map((p: Permiso) => (
    <tr key={p.id_permiso} className="border-t border-white/10">
      <td className="px-3 py-2 font-mono text-xs">{p.codigo}</td>
      <td className="px-3 py-2">{p.descripcion ?? "—"}</td>
      <td className="px-3 py-2">
        {p.activo ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">Activo</span>
        ) : (
          <span className="rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs text-neutral-400">Inactivo</span>
        )}
      </td>
      <td className="px-3 py-2">#{p.id_modulo}</td>
    </tr>
  ));

  const filasModulos = modulos.map((m: Modulo) => (
    <tr key={m.id_modulo} className="border-t border-white/10">
      <td className="px-3 py-2">{m.nombre}</td>
      <td className="px-3 py-2 text-neutral-400">{m.descripcion ?? "—"}</td>
      <td className="px-3 py-2">{m.ruta ?? "—"}</td>
      <td className="px-3 py-2">
        {m.activo ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">Activo</span>
        ) : (
          <span className="rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs text-neutral-400">Inactivo</span>
        )}
      </td>
    </tr>
  ));

  return (
    <ProtectedPage permiso="seguridad.view">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Seguridad</h1>
            <p className="text-sm text-neutral-400">Roles, permisos y módulos.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void cargar()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
            >
              <RotateCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refrescar
            </button>
          </div>
        </div>

        {/* Tabs simples */}
        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
          {(["roles", "permisos", "modulos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                tab === t ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{error}</div>
        )}

        {tab === "roles" && (
          <Section
            title="Roles"
            actions={
              puedeCrearRol && (
                <div className="flex items-center gap-2">
                  <input
                    className="rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-sm outline-none"
                    placeholder="Nombre del rol"
                    value={nuevoRol.nombre}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNuevoRol((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                  />
                  <input
                    className="hidden sm:block rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-sm outline-none"
                    placeholder="Descripción"
                    value={nuevoRol.descripcion}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNuevoRol((prev) => ({ ...prev, descripcion: e.target.value }))
                    }
                  />
                  <button
                    onClick={() => void onCrearRol()}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
                  >
                    <Plus className="size-4" />
                    Crear
                  </button>
                </div>
              )
            }
          >
            {/* Tabla Roles */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-neutral-400">
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-neutral-400" colSpan={4}>
                        No hay roles.
                      </td>
                    </tr>
                  ) : (
                    filasRoles
                  )}
                </tbody>
              </table>
            </div>

            {/* Editor inline de rol */}
            {editando && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium mb-2">Editar rol</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-400">Nombre</span>
                    <input
                      className="rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 outline-none"
                      value={editando.nombre}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditando((prev) => (prev ? { ...prev, nombre: e.target.value } : prev))
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-sm sm:col-span-2">
                    <span className="text-neutral-400">Descripción</span>
                    <input
                      className="rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 outline-none"
                      value={editando.descripcion ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditando((prev) =>
                          prev ? { ...prev, descripcion: e.target.value } : prev
                        )
                      }
                    />
                  </label>
                  <label className="mt-1 inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!editando.activo}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditando((prev) => (prev ? { ...prev, activo: e.target.checked } : prev))
                      }
                    />
                    Activo
                  </label>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => void onGuardarRol()}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
                  >
                    Guardar cambios
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </Section>
        )}

        {tab === "permisos" && (
          <Section
            title="Permisos"
            actions={
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-300">
                <Shield className="size-3.5" />
                {permisos.length} permisos
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-neutral-400">
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Módulo</th>
                  </tr>
                </thead>
                <tbody>
                  {permisos.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-neutral-400" colSpan={4}>
                        No hay permisos.
                      </td>
                    </tr>
                  ) : (
                    filasPermisos
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {tab === "modulos" && (
          <Section
            title="Módulos"
            actions={
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-300">
                <ShieldCheck className="size-3.5" />
                {modulos.length} módulos
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-neutral-400">
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2">Ruta</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {modulos.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-neutral-400" colSpan={4}>
                        No hay módulos.
                      </td>
                    </tr>
                  ) : (
                    filasModulos
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>
    </ProtectedPage>
  );
}
