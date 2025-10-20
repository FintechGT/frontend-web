"use client";

import * as React from "react";
import api from "@/lib/api";
import { Plus, Trash2, RotateCw, AlertCircle, Shield } from "lucide-react";

/* ============================================================
   Tipos
   ============================================================ */
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

type Modulo = {
  id: number;
  nombre: string;
  clave?: string | null;
  activo?: boolean;
};

type ListResp<T> = { items?: T[]; total?: number } | T[];

/* ============================================================
   Helpers
   ============================================================ */
function asArray<T>(data: ListResp<T>): T[] {
  return Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
}

function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Error desconocido";
}

/* ============================================================
   Mappers API → UI
   ============================================================ */
type ApiRol = {
  id_rol?: number;
  id?: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
};

type ApiPermiso = {
  id_permiso?: number;
  id?: number;
  id_modulo?: number;
  idModulo?: number;
  codigo: string;
  descripcion?: string | null;
  activo?: boolean;
};

type ApiModulo = {
  id_modulo?: number;
  id?: number;
  nombre: string;
  clave?: string | null;
  activo?: boolean;
};

const mapRol = (r: ApiRol): Rol => ({
  id: r.id_rol ?? r.id ?? 0,
  nombre: r.nombre,
  descripcion: r.descripcion ?? null,
  activo: r.activo ?? true,
});

const mapPermiso = (p: ApiPermiso): Permiso => ({
  id: p.id_permiso ?? p.id ?? 0,
  idModulo: p.id_modulo ?? p.idModulo ?? 0,
  codigo: p.codigo,
  descripcion: p.descripcion ?? null,
  activo: p.activo ?? true,
});

const mapModulo = (m: ApiModulo): Modulo => ({
  id: m.id_modulo ?? m.id ?? 0,
  nombre: m.nombre,
  clave: m.clave ?? null,
  activo: m.activo ?? true,
});

/* ============================================================
   API local
   ============================================================ */
async function fetchRoles(): Promise<Rol[]> {
  const { data } = await api.get<ListResp<ApiRol>>("/roles");
  return asArray<ApiRol>(data).map(mapRol);
}

async function createRol(payload: { nombre: string; descripcion?: string | null }): Promise<Rol> {
  const { data } = await api.post<ApiRol>("/roles", payload);
  return mapRol(data);
}

async function deleteRol(id: number): Promise<void> {
  await api.delete(`/roles/${id}`);
}

async function fetchPermisos(): Promise<Permiso[]> {
  const { data } = await api.get<ListResp<ApiPermiso>>("/permisos");
  return asArray<ApiPermiso>(data).map(mapPermiso);
}

async function fetchModulos(): Promise<Modulo[]> {
  const { data } = await api.get<ListResp<ApiModulo>>("/modulos");
  return asArray<ApiModulo>(data).map(mapModulo);
}

/* ============================================================
   Componente principal
   ============================================================ */
export default function RolesTab(): React.ReactElement {
  const [roles, setRoles] = React.useState<Rol[]>([]);
  const [permisos, setPermisos] = React.useState<Permiso[]>([]);
  const [modulos, setModulos] = React.useState<Modulo[]>([]);
  const [nuevoRol, setNuevoRol] = React.useState<{ nombre: string; descripcion?: string }>({ nombre: "" });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [r, p, m] = await Promise.all([fetchRoles(), fetchPermisos(), fetchModulos()]);
      setRoles(r);
      setPermisos(p);
      setModulos(m);
    } catch (e: unknown) {
      setError(getErrMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onCrearRol(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nuevoRol.nombre.trim()) return;
    try {
      const creado = await createRol({
        nombre: nuevoRol.nombre.trim(),
        descripcion: (nuevoRol.descripcion ?? "").trim() || null,
      });
      setRoles((prev) => [creado, ...prev]);
      setNuevoRol({ nombre: "" });
    } catch (e: unknown) {
      alert(getErrMsg(e));
    }
  }

  async function onEliminarRol(id: number) {
    const ok = confirm("¿Eliminar este rol?");
    if (!ok) return;
    try {
      await deleteRol(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (e: unknown) {
      alert(getErrMsg(e));
    }
  }

  /* ============================================================
     Render
     ============================================================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-blue-400" />
        <h2 className="text-xl font-semibold">Roles y Permisos</h2>
        <button
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          title="Refrescar"
        >
          <RotateCw className="size-4" />
          Refrescar
        </button>
      </div>

      {/* Estados */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-10 text-neutral-400">
          <RotateCw className="mr-2 animate-spin" />
          Cargando…
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          <AlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {/* Contenido */}
      {!loading && !error && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Roles */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-3 font-semibold">Roles</h3>

            <form onSubmit={onCrearRol} className="mb-4 flex gap-2">
              <input
                value={nuevoRol.nombre}
                onChange={(e) => setNuevoRol({ ...nuevoRol, nombre: e.target.value })}
                placeholder="Nuevo rol (ej: ADMIN)"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
              >
                <Plus className="size-4" />
                Crear
              </button>
            </form>

            <div className="space-y-2">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <div>
                    <div className="font-medium">{r.nombre}</div>
                    {r.descripcion && (
                      <div className="text-xs text-neutral-400">{r.descripcion}</div>
                    )}
                  </div>
                  <button
                    onClick={() => void onEliminarRol(r.id)}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                    title="Eliminar"
                  >
                    <Trash2 className="size-4" />
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

          {/* Permisos */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-3 font-semibold">Permisos</h3>
            <div className="space-y-2">
              {permisos.map((p) => (
                <div key={p.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="font-mono text-sm">{p.codigo}</div>
                  {p.descripcion && (
                    <div className="text-xs text-neutral-400">{p.descripcion}</div>
                  )}
                </div>
              ))}
              {permisos.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
                  Sin permisos
                </div>
              )}
            </div>
          </section>

          {/* Módulos */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-3 font-semibold">Módulos</h3>
            <div className="space-y-2">
              {modulos.map((m) => (
                <div key={m.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="font-medium">{m.nombre}</div>
                  {m.clave && <div className="text-xs text-neutral-400">{m.clave}</div>}
                </div>
              ))}
              {modulos.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
                  Sin módulos
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
