"use client";

import * as React from "react";
import api from "@/lib/api";
import { Layers, Plus, Trash2, RotateCw, AlertCircle } from "lucide-react";

/* ============================================================
   Tipos
   ============================================================ */
type Modulo = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  ruta?: string | null;
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
type ApiModulo = {
  id_modulo?: number;
  id?: number;
  nombre: string;
  descripcion?: string | null;
  ruta?: string | null;
  activo?: boolean;
};

const mapModulo = (m: ApiModulo): Modulo => ({
  id: m.id_modulo ?? m.id ?? 0,
  nombre: m.nombre,
  descripcion: m.descripcion ?? null,
  ruta: m.ruta ?? null,
  activo: m.activo ?? true,
});

/* ============================================================
   API local
   ============================================================ */
async function fetchModulos(): Promise<Modulo[]> {
  const { data } = await api.get<ListResp<ApiModulo>>("/modulos");
  return asArray<ApiModulo>(data).map(mapModulo);
}

async function createModulo(payload: { nombre: string; descripcion?: string | null; ruta?: string | null }): Promise<Modulo> {
  const { data } = await api.post<ApiModulo>("/modulos", payload);
  return mapModulo(data);
}

async function deleteModulo(id: number): Promise<void> {
  await api.delete(`/modulos/${id}`);
}

/* ============================================================
   Componente principal
   ============================================================ */
export default function ModulosTab(): React.ReactElement {
  const [modulos, setModulos] = React.useState<Modulo[]>([]);
  const [nuevo, setNuevo] = React.useState<{ nombre: string; descripcion?: string; ruta?: string }>({
    nombre: "",
    descripcion: "",
    ruta: "",
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchModulos();
      setModulos(data);
    } catch (e: unknown) {
      setError(getErrMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onCrearModulo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nuevo.nombre.trim()) return;
    try {
      const creado = await createModulo({
        nombre: nuevo.nombre.trim(),
        descripcion: (nuevo.descripcion ?? "").trim() || null,
        ruta: (nuevo.ruta ?? "").trim() || null,
      });
      setModulos((prev) => [creado, ...prev]);
      setNuevo({ nombre: "", descripcion: "", ruta: "" });
    } catch (e: unknown) {
      alert(getErrMsg(e));
    }
  }

  async function onEliminarModulo(id: number) {
    const ok = confirm("¿Eliminar este módulo?");
    if (!ok) return;
    try {
      await deleteModulo(id);
      setModulos((prev) => prev.filter((m) => m.id !== id));
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
        <Layers className="size-5 text-blue-400" />
        <h2 className="text-xl font-semibold">Módulos</h2>
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
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 font-semibold">Listado de Módulos</h3>

          {/* Formulario */}
          <form onSubmit={onCrearModulo} className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              placeholder="Nombre del módulo"
              className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              value={nuevo.descripcion ?? ""}
              onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
              placeholder="Descripción"
              className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              value={nuevo.ruta ?? ""}
              onChange={(e) => setNuevo({ ...nuevo, ruta: e.target.value })}
              placeholder="Ruta (ej: /dashboard/solicitudes)"
              className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="col-span-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
            >
              <Plus className="size-4" />
              Crear
            </button>
          </form>

          {/* Lista */}
          <div className="space-y-2">
            {modulos.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <div>
                  <div className="font-medium">{m.nombre}</div>
                  {m.descripcion && (
                    <div className="text-xs text-neutral-400">{m.descripcion}</div>
                  )}
                  {m.ruta && <div className="text-xs text-neutral-500">{m.ruta}</div>}
                </div>
                <button
                  onClick={() => void onEliminarModulo(m.id)}
                  className="rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                  title="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {modulos.length === 0 && (
              <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
                Sin módulos registrados
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
