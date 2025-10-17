// src/app/(app)/dashboard/usuarios/ActividadDrawer.tsx
"use client";

import * as React from "react";
import { X, AlertCircle, Loader2, Calendar, User, FileText, Filter } from "lucide-react";
import { getActividadUsuario, type ActividadItem } from "@/app/services/adminUsuarios";
import Badge from "@/components/ui/Badge";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: number | null;
  userName?: string;
};

export default function ActividadDrawer({ open, onClose, userId, userName }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<ActividadItem[]>([]);
  const [total, setTotal] = React.useState(0);

  // Filtros
  const [moduloFilter, setModuloFilter] = React.useState("");
  const [accionFilter, setAccionFilter] = React.useState("");

  const modulos = React.useMemo(() => {
    const set = new Set(items.map((i) => i.modulo));
    return Array.from(set).sort();
  }, [items]);

  const acciones = React.useMemo(() => {
    const set = new Set(items.map((i) => i.accion));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchModulo = !moduloFilter || item.modulo === moduloFilter;
      const matchAccion = !accionFilter || item.accion === accionFilter;
      return matchModulo && matchAccion;
    });
  }, [items, moduloFilter, accionFilter]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !userId) return;
      try {
        setLoading(true);
        setError(null);
        const r = await getActividadUsuario(userId, { 
          limit: 100, 
          offset: 0, 
          include_values: true 
        });
        if (!alive) return;
        setItems(r.items ?? []);
        setTotal(r.total ?? 0);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Error al cargar actividad");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, userId]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel deslizable */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-hidden border-l border-white/10 bg-neutral-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-2">
              <FileText className="size-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Registro de Actividad</h2>
              <p className="text-sm text-neutral-400">
                {userName ?? `Usuario #${userId ?? "?"}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Filtros */}
        {!loading && !error && items.length > 0 && (
          <div className="border-b border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-300">
              <Filter className="size-4" />
              Filtros
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={moduloFilter}
                onChange={(e) => setModuloFilter(e.target.value)}
              >
                <option value="">Todos los módulos</option>
                {modulos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={accionFilter}
                onChange={(e) => setAccionFilter(e.target.value)}
              >
                <option value="">Todas las acciones</option>
                {acciones.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="h-[calc(100vh-140px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="mx-auto size-8 animate-spin text-blue-400" />
                <p className="mt-3 text-sm text-neutral-400">Cargando actividad...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-red-400" />
                <div>
                  <div className="font-medium text-red-400">Error</div>
                  <div className="text-sm text-red-300">{error}</div>
                </div>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
              <FileText className="mx-auto size-12 text-neutral-600" />
              <p className="mt-3 font-medium text-neutral-300">Sin actividad reciente</p>
              <p className="mt-1 text-sm text-neutral-400">
                {moduloFilter || accionFilter
                  ? "Intenta ajustar los filtros"
                  : "Este usuario no tiene registros de actividad"}
              </p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-neutral-400">Total registros</div>
                  <div className="mt-1 text-xl font-bold">{total}</div>
                </div>
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="text-xs text-neutral-400">Mostrando</div>
                  <div className="mt-1 text-xl font-bold text-blue-400">
                    {filteredItems.length}
                  </div>
                </div>
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
                  <div className="text-xs text-neutral-400">Módulos únicos</div>
                  <div className="mt-1 text-xl font-bold text-purple-400">
                    {modulos.length}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                {filteredItems.map((a, idx) => (
                  <div
                    key={a.id_auditoria}
                    className="group relative rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    {/* Línea de tiempo */}
                    {idx < filteredItems.length - 1 && (
                      <div className="absolute left-8 top-12 h-full w-px bg-white/10" />
                    )}

                    <div className="flex gap-4">
                      {/* Icono */}
                      <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <User className="size-5 text-blue-400" />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="info">{a.modulo}</Badge>
                              <Badge variant="purple">{a.accion}</Badge>
                            </div>
                            {a.detalle && (
                              <p className="mt-2 text-sm text-neutral-300">{a.detalle}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <Calendar className="size-3" />
                            {new Date(a.fecha_hora).toLocaleString("es", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        {/* Cambios */}
                        {(a.old_values || a.new_values) && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-300">
                              Ver cambios realizados
                            </summary>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {a.old_values && (
                                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                  <div className="mb-1 text-xs font-medium text-neutral-400">
                                    Antes
                                  </div>
                                  <pre className="whitespace-pre-wrap break-all text-xs text-neutral-300">
                                    {a.old_values}
                                  </pre>
                                </div>
                              )}
                              {a.new_values && (
                                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                                  <div className="mb-1 text-xs font-medium text-blue-400">
                                    Después
                                  </div>
                                  <pre className="whitespace-pre-wrap break-all text-xs text-blue-300">
                                    {a.new_values}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}