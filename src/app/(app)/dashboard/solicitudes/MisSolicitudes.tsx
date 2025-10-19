//src/app/(app)/dashboard/solicitudes/MisSolicitudes.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import api from "@/lib/api";
import { RotateCw, AlertCircle, Eye } from "lucide-react";

/* ========= Tipos ========= */
type MisSolicitud = {
  id_solicitud: number;
  estado?: string;
  fecha_envio?: string | null;
  metodo_entrega?: string | null;
};

type Paginada<T> = {
  items: T[];
  total?: number;
  limit?: number;
  offset?: number;
};

/* ========= Helpers ========= */
function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Error desconocido";
}

/* ========= Página ========= */
export default function MisSolicitudesPage() {
  const [items, setItems] = React.useState<MisSolicitud[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const r = await api.get<Paginada<MisSolicitud> | MisSolicitud[]>("/solicitudes-completa");
        const data = r.data;
        const rows = Array.isArray(data) ? data : data.items ?? [];

        if (!alive) return;
        setItems(rows);
      } catch (e: unknown) {
        if (!alive) return;
        setError(getErrMsg(e) ?? "Error al cargar mis solicitudes");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-400">
        <RotateCw className="mr-2 animate-spin" />
        Cargando mis solicitudes…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-red-400">
        <AlertCircle className="mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mis Solicitudes</h2>
        <Link
          href="/dashboard/solicitudes/nueva"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Nueva solicitud
        </Link>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr className="border-b border-white/10">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Método</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-neutral-400" colSpan={5}>
                  No tienes solicitudes aún.
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id_solicitud} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-3">
                    <span className="font-mono text-blue-400">#{s.id_solicitud}</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-400 capitalize">
                      {s.estado ?? "—"}
                    </span>
                  </td>
                  <td className="p-3">
                    {s.fecha_envio
                      ? new Date(s.fecha_envio).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="p-3 capitalize">{s.metodo_entrega ?? "—"}</td>
                  <td className="p-3">
                    <Link
                      href={`/dashboard/solicitudes/${s.id_solicitud}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/20"
                    >
                      <Eye className="size-3.5" />
                      Ver detalles
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}