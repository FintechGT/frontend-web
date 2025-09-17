// src/app/(app)/dashboard/page.tsx
"use client";

import * as React from "react";
import { getMe, Me } from "@/app/services/auth";
import { listMisSolicitudes, Solicitud } from "@/app/services/solicitudes";

// Estructuras de apoyo para render
type Reciente = { id: string; tipo: string; estado: string; fecha: string };
type StatItem = { label: string; value: string | number };

function getErrorMessage(err: unknown, fallback = "Error cargando datos"): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err;
  return fallback;
}

export default function DashboardPage() {
  const [me, setMe] = React.useState<Me | null>(null);
  const [solicitudes, setSolicitudes] = React.useState<Solicitud[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [u, sols] = await Promise.all([getMe(), listMisSolicitudes()]);
        if (!alive) return;
        setMe(u);
        setSolicitudes(Array.isArray(sols) ? sols : []);
      } catch (e) {
        setErr(getErrorMessage(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // KPIs + actividad reciente
  const { activas, montoPendiente, proximoVenc, pagosRealizados, recientes } =
    React.useMemo(() => {
      const norm = (s?: string) => (s || "").toUpperCase();

      const activas = solicitudes.filter(
        (s) => !["CERRADA", "RECHAZADA", "CANCELADA"].includes(norm(s.estado))
      ).length;

      const montoPendiente = solicitudes
        .filter((s) => norm(s.estado) === "APROBADO")
        .reduce((acc, s) => acc + (Number((s as { monto?: number }).monto ?? 0)), 0);

      const fechasVenc = solicitudes
        .map((s) => (s.fecha_vencimiento ? new Date(s.fecha_vencimiento).getTime() : NaN))
        .filter((t) => !Number.isNaN(t))
        .sort((a, b) => a - b);

      const proximoVenc =
        fechasVenc.length > 0 ? new Date(fechasVenc[0]).toLocaleDateString() : "—";

      const pagosRealizados = 0; // Cuando tengas /pagos lo calculas aquí

      const recientes: Reciente[] = [...solicitudes]
        .sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 3)
        .map((s) => ({
          id: String(s.codigo ?? s.id ?? ""),
          tipo: s.tipo ?? "Empeño",
          estado: s.estado ?? "—",
          fecha: s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : "—",
        }));

      return { activas, montoPendiente, proximoVenc, pagosRealizados, recientes };
    }, [solicitudes]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-neutral-400">Cargando dashboard…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-300">{err}</p>
      </div>
    );
  }

  const stats: StatItem[] = [
    { label: "Solicitudes activas", value: activas },
    {
      label: "Monto pendiente",
      value: montoPendiente > 0 ? `Q ${montoPendiente.toLocaleString()}` : "Q 0",
    },
    { label: "Próximo vencimiento", value: proximoVenc },
    { label: "Pagos realizados", value: pagosRealizados },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-sm text-neutral-400">
          {me?.nombre ? `Hola, ${me.nombre}. ` : ""}
          Resumen de tu actividad y accesos rápidos.
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-neutral-400">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </section>

      {/* Actividad reciente */}
      <section className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-medium">Actividad reciente</h2>
          <a href="/dashboard/solicitudes" className="text-sm text-blue-400 hover:underline">
            Ver todo
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-normal">ID</th>
                <th className="px-5 py-3 font-normal">Tipo</th>
                <th className="px-5 py-3 font-normal">Estado</th>
                <th className="px-5 py-3 font-normal">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((r, i) => (
                <tr key={r.id || i} className={i % 2 ? "bg-white/5" : ""}>
                  <td className="px-5 py-3">{r.id}</td>
                  <td className="px-5 py-3">{r.tipo}</td>
                  <td className="px-5 py-3">{r.estado}</td>
                  <td className="px-5 py-3">{r.fecha}</td>
                </tr>
              ))}
              {recientes.length === 0 && (
                <tr>
                  <td className="px-5 py-4 text-neutral-400" colSpan={4}>
                    Aún no hay actividad.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-medium">Siguiente paso</h3>
          <p className="mt-1 text-sm text-neutral-300">
            Completa la evaluación de tu artículo para acelerar tu próxima solicitud.
          </p>
          <a
            href="/dashboard/solicitudes"
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Ir a solicitudes
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-medium">Tips</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
            <li>Sube fotos claras de tus artículos.</li>
            <li>Revisa fechas de vencimiento para evitar recargos.</li>
            <li>Guarda tu contrato en un lugar seguro.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
