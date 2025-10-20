"use client";

import * as React from "react";
import api from "@/lib/api";
import { Shield, RotateCw, AlertCircle, Search, Plus, Trash2 } from "lucide-react";

/* ============================================================
   Tipos
   ============================================================ */
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
type ApiPermiso = {
  id_permiso?: number;
  id?: number;
  id_modulo?: number;
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

const mapPermiso = (p: ApiPermiso): Permiso => ({
  id: p.id_permiso ?? p.id ?? 0,
  idModulo: p.id_modulo ?? 0,
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
async function fetchPermisos(): Promise<Permiso[]> {
  const { data } = await api.get<ListResp<ApiPermiso>>("/permisos");
  return asArray<ApiPermiso>(data).map(mapPermiso);
}

async function fetchModulos(): Promise<Modulo[]> {
  const { data } = await api.get<ListResp<ApiModulo>>("/modulos");
  return asArray<ApiModulo>(data).map(mapModulo);
}

async function createPermiso(payload: { codigo: string; descripcion?: string | null; id_modulo: number }): Promise<Permiso> {
  const { data } = await api.post<ApiPermiso>("/permisos", payload);
  return mapPermiso(data);
}

async function deletePermiso(id: number): Promise<void> {
  await api.delete(`/permisos/${id}`);
}

/* ============================================================
   Componente principal
   ============================================================ */
export default function PermisosTab(): React.ReactElement {
  const [permisos, setPermisos] = React.useState<Permiso[]>([]);
  const [modulos, setModulos] = React.useState<Modulo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busqueda, setBusqueda] = React.useState("");
  const [nuevo, setNuevo] = React.useState<{ codigo: string; descripcion?: string; id_modulo: number }>({
    codigo: "",
    descripcion: "",
    id_modulo: 0,
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [p, m] = await Promise.all([fetchPermisos(), fetchModulos()]);
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

  async function onCrearPermiso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nuevo.codigo.trim() || nuevo.id_modulo === 0) return;
    try {
      const creado = await createPermiso({
        codigo: nuevo.codigo.trim(),
        descripcion: (nuevo.descripcion ?? "").trim() || null,
        id_modulo: nuevo.id_modulo,
      });
      setPermisos((prev) => [creado, ...prev]);
      setNuevo({ codigo: "", descripcion: "", id_modulo: 0 });
    } catch (e: unknown) {
      alert(getErrMsg(e));
    }
  }

  async function onEliminarPermiso(id: number) {
    const ok = confirm("¿Eliminar este permiso?");
    if (!ok) return;
    try {
      await deletePermiso(id);
      setPermisos((prev) => prev.filter((p) => p.id !== id));
    } catch (e: unknown) {
      alert(getErrMsg(e));
    }
  }

  const filtrados = permisos.filter((p) =>
    p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  /* ============================================================
     Render
     ============================================================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-blue-400" />
        <h2 className="text-xl font-semibold">Permisos</h2>
        <button
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          title="Refrescar"
        >
          <RotateCw className="size-4" />
          Refrescar
        </button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2">
        <Search className="text-neutral-400" />
        <input
          type="text"
          placeholder="Buscar permiso por código…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
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
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 font-semibold">Listado de Permisos</h3>

          {/* Formulario */}
          <form onSubmit={onCrearPermiso} className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              value={nuevo.codigo}
              onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })}
              placeholder="Código (ej: solicitudes.create)"
              className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <select
              value={nuevo.id_modulo}
              onChange={(e) => setNuevo({ ...nuevo, id_modulo: Number(e.target.value) })}
              className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value={0}>Seleccionar módulo</option>
              {modulos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
            >
              <Plus className="size-4" />
              Crear
            </button>
          </form>

          {/* Lista */}
          <div className="space-y-2">
            {filtrados.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <div>
                  <div className="font-mono text-sm">{p.codigo}</div>
                  {p.descripcion && (
                    <div className="text-xs text-neutral-400">{p.descripcion}</div>
                  )}
                </div>
                <button
                  onClick={() => void onEliminarPermiso(p.id)}
                  className="rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                  title="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {filtrados.length === 0 && (
              <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
                Sin permisos encontrados
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
