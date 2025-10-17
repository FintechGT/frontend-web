// src/app/(app)/dashboard/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePermiso } from "@/hooks/usePermiso";
import { listMisSolicitudes, type Solicitud } from "@/app/services/solicitudes";
import { obtenerEstadisticasSolicitudes } from "@/app/services/adminSolicitudes";
import { FileText, DollarSign, Calendar, TrendingUp, Users, AlertCircle } from "lucide-react";

/* ===================== Utils ===================== */
function getErrMsg(err: unknown): string {
  return err instanceof Error ? err.message : "Error desconocido";
}

function formatDate(d?: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
}

function toKey(x: string | number): string {
  return String(x);
}

/** Intenta comparar por fecha; si no hay fecha, usa id numérico; si no, string. */
function compareRecientes(a: Solicitud, b: Solicitud): number {
  const fa = a.created_at ?? a.fecha_envio ?? null;
  const fb = b.created_at ?? b.fecha_envio ?? null;
  if (fa && fb) {
    const da = new Date(fa).getTime();
    const db = new Date(fb).getTime();
    if (!Number.isNaN(da) && !Number.isNaN(db)) return db - da; // desc
  }
  const ida = Number(a.id_solicitud);
  const idb = Number(b.id_solicitud);
  if (!Number.isNaN(ida) && !Number.isNaN(idb)) return idb - ida; // desc
  return toKey(b.id_solicitud).localeCompare(toKey(a.id_solicitud));
}

/* ===================== Page ===================== */
export default function DashboardPage() {
  // Si tu hook retorna boolean, está bien; si retorna {allowed, loading}, ajusta abajo.
  const esAdmin = usePermiso(["ADMIN_SOLICITUDES_LISTAR", "usuarios.view", "valuacion.aprobar"]);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Solicitud[]>([]);
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (esAdmin) {
          const estadisticas = await obtenerEstadisticasSolicitudes();
          if (alive) setStats(estadisticas);
        } else {
          const data = await listMisSolicitudes();
          if (alive) setItems(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (alive) setError(getErrMsg(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [esAdmin]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2">
            <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <span className="text-sm text-neutral-300">Cargando…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-400" />
            <div>
              <div className="font-medium text-red-400">Error al cargar</div>
              <div className="mt-1 text-sm text-red-300">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ========== VISTA ADMIN ========== */
  if (esAdmin && stats) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Dashboard Administrativo</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-400">
              <Users className="size-3" />
              Admin
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">Vista general del sistema de empeños</p>
        </div>

        {/* KPIs principales */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total solicitudes"
            value={stats.total_solicitudes}
            icon={<FileText className="size-5" />}
            color="blue"
          />
          <KpiCard
            title="Solicitudes hoy"
            value={stats.solicitudes_hoy}
            icon={<Calendar className="size-5" />}
            color="emerald"
          />
          <KpiCard
            title="Esta semana"
            value={stats.solicitudes_semana}
            icon={<TrendingUp className="size-5" />}
            color="purple"
          />
          <KpiCard
            title="Pendientes de evaluar"
            value={stats.articulos_pendientes_evaluacion}
            icon={<AlertCircle className="size-5" />}
            color="yellow"
          />
        </section>

        {/* Estados de solicitudes */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 font-semibold">Solicitudes por estado</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats.por_estado ?? {}).map(([estado, cantidad]) => (
              <div key={estado} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-sm capitalize text-neutral-400">{estado}</div>
                <div className="mt-1 text-2xl font-semibold">{cantidad as number}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Accesos rápidos */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 font-semibold">Accesos rápidos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard/solicitudes"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <FileText className="size-8 text-blue-400" />
              <div>
                <div className="font-medium">Todas las solicitudes</div>
                <div className="text-xs text-neutral-400">Gestionar solicitudes</div>
              </div>
            </Link>

            <Link
              href="/dashboard/usuarios"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <Users className="size-8 text-emerald-400" />
              <div>
                <div className="font-medium">Usuarios</div>
                <div className="text-xs text-neutral-400">Administrar usuarios</div>
              </div>
            </Link>

            <Link
              href="/dashboard/prestamos"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <DollarSign className="size-8 text-purple-400" />
              <div>
                <div className="font-medium">Préstamos</div>
                <div className="text-xs text-neutral-400">Ver préstamos activos</div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  /* ========== VISTA USUARIO ========== */
  const solicitudesActivas = items.length;
  const montoPendienteQ = 0; // TODO: suma real desde API
  const pagosRealizados = 0; // TODO: desde API

  const proximoVenc = React.useMemo(() => {
    const fechas = items.map((s) => s.fecha_vencimiento).filter((f): f is string => Boolean(f));
    const min = fechas.length
      ? fechas.reduce((a, b) => (new Date(a) < new Date(b) ? a : b))
      : null;
    return formatDate(min);
  }, [items]);

  const recientes = React.useMemo(() => {
    const sorted = [...items].sort(compareRecientes);
    return sorted.slice(0, 4);
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="mt-1 text-sm text-neutral-400">Resumen de tu actividad y accesos rápidos.</p>
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

      {/* Actividad reciente */}
      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-medium">Actividad reciente</h2>
          <Link href="/dashboard/solicitudes" className="text-sm text-blue-400 hover:underline">
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
              {recientes.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-400" colSpan={4}>
                    No hay actividad reciente.
                  </td>
                </tr>
              ) : (
                recientes.map((s) => (
                  <tr key={toKey(s.id_solicitud)} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 place-items-center rounded-lg bg-white/10 text-xs">#</div>
                        <span className="font-medium">#{s.id_solicitud}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="tabular-nums">{s.codigo ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 capitalize">{s.estado ?? "—"}</td>
                    <td className="px-4 py-3">{formatDate(s.created_at ?? s.fecha_envio)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ===================== KpiCard ===================== */
function KpiCard({
  title,
  value,
  icon,
  color = "white",
}: {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: "white" | "blue" | "emerald" | "purple" | "yellow";
}) {
  const colorClasses: Record<NonNullable<typeof color>, string> = {
    white: "border-white/10 bg-white/5",
    blue: "border-blue-500/30 bg-blue-500/10",
    emerald: "border-emerald-500/30 bg-emerald-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    yellow: "border-yellow-500/30 bg-yellow-500/10",
  };

  const iconColorClasses: Record<NonNullable<typeof color>, string> = {
    white: "text-neutral-400",
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
  };

  return (
    <div className={`rounded-2xl border ${colorClasses[color]} px-4 py-5`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">{title}</div>
        {icon && <div className={iconColorClasses[color]}>{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
