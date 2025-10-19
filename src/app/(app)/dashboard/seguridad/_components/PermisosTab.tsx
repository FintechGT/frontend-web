// src/app/(app)/dashboard/seguridad/_components/PermisosTab.tsx
"use client";

import * as React from "react";
import api from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";

type Modulo = { id: number; nombre: string; descripcion?: string | null; activo?: boolean };
type Permiso = { id: number; idModulo: number; codigo: string; descripcion?: string | null; activo?: boolean };

const mapModulo = (m: any): Modulo => ({
  id: m.id_modulo ?? m.id,
  nombre: m.nombre,
  descripcion: m.descripcion ?? null,
  activo: m.activo ?? true,
});
const mapPermiso = (p: any): Permiso => ({
  id: p.id_permiso ?? p.id,
  idModulo: p.id_modulo ?? p.idModulo,
  codigo: p.codigo,
  descripcion: p.descripcion ?? null,
  activo: p.activo ?? true,
});

async function fetchModulos(): Promise<Modulo[]> {
  const { data } = await api.get("/modulos", { params: { activo: true } });
  return Array.isArray(data) ? data.map(mapModulo) : [];
}
async function fetchPermisos(idModulo?: number): Promise<Permiso[]> {
  const { data } = await api.get("/permisos", { params: { id_modulo: idModulo ?? null } });
  return Array.isArray(data) ? data.map(mapPermiso) : [];
}
async function createPermiso(payload: { id_modulo: number; codigo: string; descripcion?: string | null }): Promise<Permiso> {
  const { data } = await api.post("/permisos", payload);
  return mapPermiso(data);
}
async function deletePermiso(idPermiso: number): Promise<void> {
  await api.delete(`/permisos/${idPermiso}`);
}

export default function PermisosTab() {
  const [modulos, setModulos] = React.useState<Modulo[]>([]);
  const [idModulo, setIdModulo] = React.useState<number | "all">("all");
  const [permisos, setPermisos] = React.useState<Permiso[]>([]);

  const [nuevo, setNuevo] = React.useState<{ codigo: string; descripcion?: string }>({ codigo: "" });

  const load = React.useCallback(async () => {
    const ms = await fetchModulos();
    setModulos(ms);
    const ps = await fetchPermisos(idModulo === "all" ? undefined : idModulo);
    setPermisos(ps);
  }, [idModulo]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onCrear(e: React.FormEvent) {
    e.preventDefault();
    if (idModulo === "all") return alert("Selecciona un módulo para crear un permiso.");
    if (!nuevo.codigo.trim()) return;
    const creado = await createPermiso({
      id_modulo: idModulo,
      codigo: nuevo.codigo.trim().toLowerCase(),
      descripcion: (nuevo.descripcion ?? "").trim() || null,
    });
    setPermisos((prev) => [creado, ...prev]);
    setNuevo({ codigo: "" });
  }

  async function onEliminar(id: number) {
    if (!confirm("¿Eliminar este permiso?")) return;
    await deletePermiso(id);
    setPermisos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Filtro por módulo + crear */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 font-semibold">Filtro y creación</h2>

        <label className="mb-2 block text-sm text-neutral-300">Módulo</label>
        <select
          value={idModulo}
          onChange={(e) => setIdModulo(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="mb-4 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">Todos</option>
          {modulos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>

        <form onSubmit={onCrear} className="grid gap-2">
          <input
            value={nuevo.codigo}
            onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })}
            placeholder="permiso (p.ej. solicitudes.view)"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={nuevo.descripcion ?? ""}
            onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
            placeholder="Descripción (opcional)"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            disabled={idModulo === "all"}
          >
            <Plus className="size-4" />
            Crear permiso
          </button>
        </form>
      </section>

      {/* Lista permisos */}
      <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 font-semibold">
          Permisos {idModulo === "all" ? "(todos)" : `(módulo ${idModulo})`}
        </h2>
        <div className="space-y-2">
          {permisos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3">
              <div>
                <div className="font-mono text-sm">{p.codigo}</div>
                {p.descripcion && <div className="text-xs text-neutral-400">{p.descripcion}</div>}
              </div>
              <button
                onClick={() => void onEliminar(p.id)}
                className="rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                title="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {permisos.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-neutral-400">
              Sin permisos
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
