// src/app/(app)/dashboard/seguridad/_components/ModulosTab.tsx
"use client";

import * as React from "react";
import api from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";

type Modulo = { id: number; nombre: string; descripcion?: string | null; ruta?: string | null; activo?: boolean };

const mapModulo = (m: any): Modulo => ({
  id: m.id_modulo ?? m.id,
  nombre: m.nombre,
  descripcion: m.descripcion ?? null,
  ruta: m.ruta ?? null,
  activo: m.activo ?? true,
});

async function fetchModulos(): Promise<Modulo[]> {
  const { data } = await api.get("/modulos");
  return Array.isArray(data) ? data.map(mapModulo) : [];
}
async function createModulo(payload: { nombre: string; descripcion?: string | null; ruta?: string | null }): Promise<Modulo> {
  const { data } = await api.post("/modulos", payload);
  return mapModulo(data);
}
async function updateModulo(id: number, payload: Partial<{ nombre: string; descripcion?: string | null; ruta?: string | null; activo?: boolean }>): Promise<void> {
  await api.patch(`/modulos/${id}`, payload);
}
async function deleteModulo(id: number): Promise<void> {
  await api.delete(`/modulos/${id}`);
}

export default function ModulosTab() {
  const [modulos, setModulos] = React.useState<Modulo[]>([]);
  const [nuevo, setNuevo] = React.useState<{ nombre: string; descripcion?: string; ruta?: string }>({ nombre: "" });

  const load = React.useCallback(async () => {
    const ms = await fetchModulos();
    setModulos(ms);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevo.nombre.trim()) return;
    const creado = await createModulo({
      nombre: nuevo.nombre.trim(),
      descripcion: (nuevo.descripcion ?? "").trim() || null,
      ruta: (nuevo.ruta ?? "").trim() || null,
    });
    setModulos((prev) => [creado, ...prev]);
    setNuevo({ nombre: "" });
  }

  async function onToggleActivo(m: Modulo) {
    await updateModulo(m.id, { activo: !m.activo });
    setModulos((prev) => prev.map((x) => (x.id === m.id ? { ...x, activo: !x.activo } : x)));
  }

  async function onEliminar(id: number) {
    if (!confirm("¿Eliminar este módulo?")) return;
    await deleteModulo(id);
    setModulos((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Crear */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 font-semibold">Crear módulo</h2>
        <form onSubmit={onCrear} className="grid gap-2">
          <input
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            placeholder="Nombre (ej: Solicitudes)"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={nuevo.descripcion ?? ""}
            onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
            placeholder="Descripción (opcional)"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={nuevo.ruta ?? ""}
            onChange={(e) => setNuevo({ ...nuevo, ruta: e.target.value })}
            placeholder="Ruta (opcional, ej: /dashboard/solicitudes)"
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

      {/* Lista */}
      <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 font-semibold">Módulos</h2>
        <div className="space-y-2">
          {modulos.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3">
              <div>
                <div className="font-medium">
                  {m.nombre}{" "}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      m.activo ? "bg-green-500/20 text-green-300" : "bg-neutral-500/20 text-neutral-300"
                    }`}
                  >
                    {m.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                {m.descripcion && <div className="text-xs text-neutral-400">{m.descripcion}</div>}
                {m.ruta && <div className="text-xs text-neutral-500">Ruta: {m.ruta}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void onToggleActivo(m)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
                >
                  {m.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => void onEliminar(m.id)}
                  className="rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                  title="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
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
  );
}
