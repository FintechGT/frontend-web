// src/app/(app)/dashboard/seguridad/_components/RolesTab.tsx
"use client";

import * as React from "react";
import api from "@/lib/api";
import { Plus, Trash2, X } from "lucide-react";

/* ================== Tipos ================== */
type Rol = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
};

type Permiso = {
  id: number;
  idModulo: number;
  codigo: string;
  descripcion?: string | null;
  activo?: boolean;
};

/* ================== Mappers (snake_case → camelCase) ================== */
const mapRol = (r: any): Rol => ({
  id: r.id_rol ?? r.id,
  nombre: r.nombre,
  descripcion: r.descripcion ?? null,
  activo: r.activo ?? true,
});

const mapPermiso = (p: any): Permiso => ({
  id: p.id_permiso ?? p.id,
  idModulo: p.id_modulo ?? p.idModulo,
  codigo: p.codigo,
  descripcion: p.descripcion ?? null,
  activo: p.activo ?? true,
});

/* ================== API helpers ================== */
async function fetchRoles(): Promise<Rol[]> {
  const { data } = await api.get("/roles", { params: { limit: 200, offset: 0 } });
  return Array.isArray(data) ? data.map(mapRol) : [];
}
async function createRol(payload: { nombre: string; descripcion?: string | null }): Promise<Rol> {
  const { data } = await api.post("/roles", payload);
  return mapRol(data);
}
async function deleteRol(id: number): Promise<void> {
  await api.delete(`/roles/${id}`);
}

async function fetchPermisos(): Promise<Permiso[]> {
  const { data } = await api.get("/permisos");
  return Array.isArray(data) ? data.map(mapPermiso) : [];
}

async function fetchPermisosDeRol(idRol: number): Promise<number[]> {
  const { data } = await api.get(`/roles/${idRol}/permisos`);
  const arr: Permiso[] = Array.isArray(data) ? data.map(mapPermiso) : [];
  return arr.map((p) => p.id);
}

/** BULK add — tu backend: { items: [{ id_permiso }] } */
async function bulkAgregarPermisos(idRol: number, ids: number[]) {
  const payload = {
    items: ids.map((id) => ({ id_permiso: id })),
  };
  await api.post(`/roles/${idRol}/permisos`, payload);
}

/** BULK remove — intentamos { items: [{ id_permiso }] }; si falla, fallback 1x1 */
async function bulkQuitarPermisos(idRol: number, ids: number[]) {
  const payload = {
    items: ids.map((id) => ({ id_permiso: id })),
  };
  try {
    await api.delete(`/roles/${idRol}/permisos`, { data: payload });
  } catch {
    for (const idPermiso of ids) {
      await api.delete(`/roles/${idRol}/permisos/${idPermiso}`);
    }
  }
}

/* ================== Componente ================== */
export default function RolesTab() {
  const [roles, setRoles] = React.useState<Rol[]>([]);
  const [permisos, setPermisos] = React.useState<Permiso[]>([]);

  const [nuevoRol, setNuevoRol] = React.useState<{ nombre: string; descripcion?: string }>({
    nombre: "",
  });

  const [drawer, setDrawer] = React.useState<{
    abierto: boolean;
    rol?: Rol;
    permisosRol: Set<number>;   // set editable en UI
    originales: Set<number>;    // snapshot para diff
    guardando: boolean;
  }>({
    abierto: false,
    permisosRol: new Set(),
    originales: new Set(),
    guardando: false,
  });

  const load = React.useCallback(async () => {
    try {
      const [rs, ps] = await Promise.all([fetchRoles(), fetchPermisos()]);
      setRoles(rs);
      setPermisos(ps);
    } catch (err) {
      alert((err as Error).message);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  /* ====== CRUD Roles ====== */
  async function onCrearRol(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoRol.nombre.trim()) return;
    try {
      const creado = await createRol({
        nombre: nuevoRol.nombre.trim(),
        descripcion: (nuevoRol.descripcion ?? "").trim() || null,
      });
      setRoles((prev) => [creado, ...prev]);
      setNuevoRol({ nombre: "" });
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function onEliminarRol(id: number) {
    if (!confirm("¿Eliminar este rol?")) return;
    try {
      await deleteRol(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  /* ====== Drawer asignación (edición en lote) ====== */
  async function abrirDrawer(r: Rol) {
    try {
      const ids = await fetchPermisosDeRol(r.id);
      const setIds = new Set(ids);
      setDrawer({
        abierto: true,
        rol: r,
        permisosRol: new Set(setIds), // editable
        originales: new Set(setIds),   // snapshot
        guardando: false,
      });
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function toggleLocal(idPermiso: number, checked: boolean) {
    setDrawer((d) => {
      const next = new Set(d.permisosRol);
      if (checked) next.add(idPermiso);
      else next.delete(idPermiso);
      return { ...d, permisosRol: next };
    });
  }

  function cerrarDrawer() {
    setDrawer({ abierto: false, permisosRol: new Set(), originales: new Set(), guardando: false });
  }

  async function guardarCambios() {
    if (!drawer.rol) return;
    const idRol = drawer.rol.id;

    // calcula diferencias
    const actuales = drawer.permisosRol;
    const originales = drawer.originales;

    const agregar: number[] = [];
    const quitar: number[] = [];

    for (const id of actuales) if (!originales.has(id)) agregar.push(id);
    for (const id of originales) if (!actuales.has(id)) quitar.push(id);

    if (agregar.length === 0 && quitar.length === 0) {
      cerrarDrawer();
      return;
    }

    try {
      setDrawer((d) => ({ ...d, guardando: true }));

      if (agregar.length > 0) {
        await bulkAgregarPermisos(idRol, agregar);
      }
      if (quitar.length > 0) {
        await bulkQuitarPermisos(idRol, quitar);
      }

      setDrawer((d) => ({
        ...d,
        originales: new Set(d.permisosRol),
        guardando: false,
      }));
      cerrarDrawer();
    } catch (err) {
      setDrawer((d) => ({ ...d, guardando: false }));
      alert((err as Error).message);
    }
  }

  /* ================== Render ================== */
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Crear rol */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 font-semibold">Crear rol</h2>
        <form onSubmit={onCrearRol} className="grid gap-2">
          <input
            value={nuevoRol.nombre}
            onChange={(e) => setNuevoRol({ ...nuevoRol, nombre: e.target.value })}
            placeholder="Nombre (ej: ADMIN)"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={nuevoRol.descripcion ?? ""}
            onChange={(e) => setNuevoRol({ ...nuevoRol, descripcion: e.target.value })}
            placeholder="Descripción (opcional)"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
          >
            <Plus className="size-4" />
            Crear
          </button>
        </form>
      </section>

      {/* Listado de roles */}
      <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 font-semibold">Roles</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {roles.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.nombre}</div>
                  {r.descripcion && <div className="text-xs text-neutral-400">{r.descripcion}</div>}
                </div>
                {r.nombre.toLowerCase() !== "admin" && (
                  <button
                    onClick={() => void onEliminarRol(r.id)}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                    title="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => void abrirDrawer(r)}
                className="mt-2 w-full rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
              >
                Asignar permisos ▸
              </button>
            </div>
          ))}
          {roles.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
              Sin roles
            </div>
          )}
        </div>
      </section>

      {/* Drawer lateral (edición en lote) */}
      {drawer.abierto && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={cerrarDrawer} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg overflow-auto border-l border-white/10 bg-neutral-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Permisos del rol: <span className="text-blue-300">{drawer.rol?.nombre}</span>
              </h3>
              <button onClick={cerrarDrawer} className="rounded-lg p-2 text-neutral-300 hover:bg-white/10" title="Cerrar">
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-lg border border-white/10">
              {permisos.map((p, idx) => {
                const checked = drawer.permisosRol.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                      idx < permisos.length - 1 ? "border-b border-white/10" : ""
                    }`}
                  >
                    <div>
                      <div className="font-mono">{p.codigo}</div>
                      {p.descripcion && <div className="text-xs text-neutral-400">{p.descripcion}</div>}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleLocal(p.id, e.currentTarget.checked)}
                      className="size-4 accent-blue-600"
                    />
                  </label>
                );
              })}
              {permisos.length === 0 && <div className="p-4 text-center text-neutral-400">No hay permisos</div>}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={cerrarDrawer}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                disabled={drawer.guardando}
              >
                Cancelar
              </button>
              <button
                onClick={() => void guardarCambios()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
                disabled={drawer.guardando}
              >
                {drawer.guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
