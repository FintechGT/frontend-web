"use client";

import * as React from "react";
import api from "@/lib/api";
import { RotateCw, AlertCircle } from "lucide-react";

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
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold">Mis Solicitudes</h2>
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-100">
            <tr>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Método</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id_solicitud} className="border-t border-neutral-800">
                <td className="p-2">{s.estado ?? "—"}</td>
                <td className="p-2">
                  {s.fecha_envio
                    ? new Date(s.fecha_envio).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="p-2">{s.metodo_entrega ?? "—"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-4 text-center text-neutral-400" colSpan={3}>
                  No tienes solicitudes aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
