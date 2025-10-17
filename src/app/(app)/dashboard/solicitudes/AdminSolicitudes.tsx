"use client";

import * as React from "react";
import Link from "next/link";
import api from "@/lib/api";
import { RotateCw, AlertCircle, RefreshCw } from "lucide-react";

/* ===== Tipos que devuelve tu backend en /admin/solicitudes ===== */
export type AdminSolicitud = {
  id_solicitud: number;
  id_usuario: number;
  usuario_nombre: string;
  usuario_correo?: string;
  estado: string;
  fecha_envio: string | null;
  metodo_entrega?: string | null;
  total_articulos?: number;
  articulos_aprobados?: number;
  articulos_rechazados?: number;
  articulos_pendientes?: number;
};

export type ListResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

/* ===== Helpers ===== */
function dmy(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return "Error desconocido";
}

/* ===== Página ===== */
export default function AdminSolicitudesPage() {
  const [items, setItems] = React.useState<AdminSolicitud[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [limit, setLimit] = React.useState<number>(50);
  const [offset, setOffset] = React.useState<number>(0);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const r = await api.get<ListResponse<AdminSolicitud>>("/admin/solicitudes", {
        params: { limit, offset },
      });

      const { items: solicitudes, total: totalCount } = r.data;
      setItems(solicitudes ?? []);
      setTotal(totalCount ?? 0);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="p-4 space-y-4">
      {/* Header / acciones */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Solicitudes (Administración)</h2>
        <button
          onClick={() => void fetchData()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          title="Refrescar"
        >
          <RefreshCw className="size-4" />
          Refrescar
        </button>
      </div>

      {/* Estados */}
      {loading && (
        <div className="text-neutral-400 flex items-center justify-center py-16">
          <RotateCw className="mr-2 animate-spin" />
          Cargando solicitudes…
        </div>
      )}

      {error && !loading && (
        <div className="text-red-400 flex items-center justify-center py-16">
          <AlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-100">
              <tr>
                <th className="p-2 text-left">Cliente</th>
                <th className="p-2 text-left">Correo</th>
                <th className="p-2 text-left">Estado</th>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Método</th>
                <th className="p-2 text-left">Artículos</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id_solicitud} className="border-t border-neutral-800">
                  <td className="p-2">{s.usuario_nombre}</td>
                  <td className="p-2">{s.usuario_correo ?? "—"}</td>
                  <td className="p-2 capitalize">{s.estado}</td>
                  <td className="p-2">{dmy(s.fecha_envio)}</td>
                  <td className="p-2 capitalize">{s.metodo_entrega ?? "—"}</td>
                  <td className="p-2">
                    {s.total_articulos ?? 0} ·{" "}
                    <span className="text-emerald-400">{s.articulos_aprobados ?? 0} ok</span>
                    {" / "}
                    <span className="text-yellow-400">{s.articulos_pendientes ?? 0} pend</span>
                    {" / "}
                    <span className="text-red-400">{s.articulos_rechazados ?? 0} rech</span>
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/dashboard/solicitudes/${s.id_solicitud}/admin`}
                      className="inline-block rounded bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-neutral-400" colSpan={7}>
                    No hay solicitudes para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación simple */}
      {!loading && !error && total > limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-400">
            Mostrando {items.length} de {total}
          </div>
          <div className="flex gap-2">
            <button
              disabled={!canPrev}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={!canNext}
              onClick={() => setOffset(offset + limit)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
