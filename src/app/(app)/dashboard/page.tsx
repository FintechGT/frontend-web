// src/app/(app)/dashboard/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/app/AppLayoutClient";
import { listMisSolicitudes, type Solicitud } from "@/app/services/solicitudes";

type StatItem = { label: string; value: string | number };
type Reciente = {
  id: string;
  codigo?: string;
  estado: string;
  fecha: string;
  thumb?: string | null;
};

function errMsg(e: unknown, fb = "Error cargando datos") {
  if (e instanceof Error) return e.message || fb;
  if (typeof e === "string") return e;
  return fb;
}

const fmtQ = (n: number) =>
  `Q ${new Intl.NumberFormat("es-GT", { maximumFractionDigits: 2 }).format(n)}`;

export default function DashboardPage() {
  const { user } = useAuth(); // nombre y correo vienen del contexto
  const [solicitudes, setSolicitudes] = React.useState<Solicitud[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Cargar solicitudes del usuario
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const sols = await listMisSolicitudes();
        if (!alive) return;
        setSolicitudes(Array.isArray(sols) ? sols : []);
      } catch (e) {
        if (!alive) return;
        setError(errMsg(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // KPIs y actividad reciente
  const { activas, montoPendiente, proximoVenc, pagosRealizados, recientes } =
    React.useMemo(() => {
      const norm = (s?: string) => (s || "").trim().toUpperCase();

      const activas = solicitudes.filter(
        (s) => !["CERRADA", "RECHAZADA", "CANCELADA"].includes(norm(s.estado))
      ).length;

      // Si tu API aún no devuelve monto por solicitud, esto quedará en 0 sin romper
      const montoPendiente = solicitudes
        .filter((s) => norm(s.estado) === "APROBADO")
        .reduce((acc) => acc + 0, 0);

      const fechasVenc = solicitudes
        .map((s) => (s.fecha_vencimiento ? new Date(s.fecha_vencimiento).getTime() : NaN))
        .filter((t) => !Number.isNaN(t))
        .sort((a, b) => a - b);

      const proximoVenc =
        fechasVenc.length > 0 ? new Date(fechasVenc[0]).toLocaleDateString() : "—";

      const pagosRealizados = 0; // cuando expongas /pagos, calcula aquí

      const recientes: Reciente[] = [...solicitudes]
        .sort((a, b) => {
          const aRef = (a.created_at as any) || (a as any).fecha_envio || "";
          const bRef = (b.created_at as any) || (b as any).fecha_envio || "";
          const ta = aRef ? new Date(aRef).getTime() : 0;
          const tb = bRef ? new Date(bRef).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 4)
        .map((s) => ({
          id: String((s as any).id_solicitud ?? s.codigo ?? ""),
          codigo: (s as any).codigo,
          estado: s.estado ?? "—",
          fecha: ((s as any).created_at || (s as any).fecha_envio)
            ? new Date(((s as any).created_at || (s as any).fecha_envio)!).toISOString().slice(0, 10)
            : "—",
          thumb: s.articulos?.[0]?.fotos?.[0]?.url ?? null,
        }));

      return { activas, montoPendiente, proximoVenc, pagosRealizados, recientes };
    }, [solicitudes]);

  // UI: loading y error
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="mb-3 text-sm text-red-300">{error}</p>
        <button
          onClick={() => location.reload()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const stats: StatItem[] = [
    { label: "Solicitudes activas", value: activas },
    { label: "Monto pendiente", value: montoPendiente > 0 ? fmtQ(montoPendiente) : "Q 0" },
    { label: "Próximo vencimiento", value: proximoVenc },
    { label: "Pagos realizados", value: pagosRealizados },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-sm text-neutral-400">
          {user?.nombre ? `Hola, ${user.nombre}. ` : ""}Resumen de tu actividad y accesos rápidos.
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
          <Link href="/dashboard/solicitudes" className="text-sm text-blue-400 hover:underline">
            Ver todo
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-normal">Solicitud</th>
                <th className="px-5 py-3 font-normal">Código</th>
                <th className="px-5 py-3 font-normal">Estado</th>
                <th className="px-5 py-3 font-normal">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((r, i) => (
                <tr key={r.id || i} className={i % 2 ? "bg-white/5" : ""}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 overflow-hidden rounded-lg border border-white/10 bg-neutral-900">
                        {r.thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.thumb}
                            alt="foto"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : null}
                      </div>
                      <span>#{r.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">{r.codigo ?? "—"}</td>
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

      {/* Acciones rápidas */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-medium">Siguiente paso</h3>
          <p className="mt-1 text-sm text-neutral-300">
            Crea una nueva solicitud o continúa donde te quedaste.
          </p>
          <Link
            href="/dashboard/solicitudes"
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Ir a solicitudes
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-medium">Tips</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
            <li>Usa fotos claras (frente, atrás y número de serie).</li>
            <li>Revisa fechas de vencimiento para evitar recargos.</li>
            <li>Guarda tu contrato en un lugar seguro.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
