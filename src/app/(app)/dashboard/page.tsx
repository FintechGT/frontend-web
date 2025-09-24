"use client";

import * as React from "react";
import Link from "next/link";
import { listMisSolicitudes, type Solicitud } from "@/app/services/solicitudes";

/** Utilidad segura para mensajes de error */
function getErrMsg(err: unknown): string {
  return err instanceof Error ? err.message : "Error desconocido";
}

function formatDate(d?: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString();
}

export default function DashboardPage() {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Solicitud[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listMisSolicitudes();
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setError(getErrMsg(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);


  const solicitudesActivas = items.length;
  const montoPendienteQ = 0; 
  const pagosRealizados = 0; 


  const proximoVenc = React.useMemo(() => {
    const fechas = items
      .map((s) => s.fecha_vencimiento)
      .filter((f): f is string => Boolean(f));
    const min = fechas.length
      ? fechas.reduce((a, b) => (new Date(a) < new Date(b) ? a : b))
      : null;
    return formatDate(min);
  }, [items]);


  const recientes = React.useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => b.id_solicitud - a.id_solicitud
    );
    return sorted.slice(0, 4);
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Resumen de tu actividad y accesos rápidos.
        </p>
      </div>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Solicitudes activas" value={solicitudesActivas} />
        <KpiCard
          title="Monto pendiente"
          value={
            <span>
              Q <span className="tabular-nums">{montoPendienteQ}</span>
            </span>
          }
        />
        <KpiCard title="Próximo vencimiento" value={proximoVenc} />
        <KpiCard title="Pagos realizados" value={pagosRealizados} />
      </section>

      {/* Estado de carga / error */}
      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
          Cargando información…
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          {error}
        </div>
      )}

      {/* Actividad reciente */}
      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-medium">Actividad reciente</h2>
          <Link
            href="/dashboard/solicitudes"
            className="text-sm text-blue-400 hover:underline"
          >
            Ver todo
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-neutral-400">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3">Solicitud</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {!loading && recientes.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-neutral-400" colSpan={4}>
                    No hay actividad reciente.
                  </td>
                </tr>
              )}
              {recientes.map((s) => (
                <tr
                  key={s.id_solicitud}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-lg bg-white/10 text-xs">
                        #
                      </div>
                      <span className="font-medium">
                        #{s.id_solicitud}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="tabular-nums">
                      {s.codigo ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {s.estado ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(s.created_at ?? s.fecha_envio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
