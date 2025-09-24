"use client";

import * as React from "react";
import Link from "next/link";
import { listMisSolicitudes, type Solicitud } from "@/app/services/solicitudes";

/* ===== Helpers ===== */
function formatDate(d?: string | null) {
  if (!d) return "—";
  const iso = d.slice(0, 10);
  // Evita diferencias de locale entre SSR/CSR
  return iso;
}

function getProximoVencimiento(items: Solicitud[]) {
  const fechas = items
    .map((s) => s.fecha_vencimiento || s.created_at || s.fecha_envio || null)
    .filter(Boolean) as string[];

  if (!fechas.length) return "—";
  const min = fechas.sort((a, b) => (a < b ? -1 : 1))[0];
  return formatDate(min);
}

/* ===== Page ===== */
export default function DashboardPage() {
  const [items, setItems] = React.useState<Solicitud[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError(null);
        const data = await listMisSolicitudes();
        if (!alive) return;
        // Ordena por fecha desc (created_at || fecha_envio)
        const sorted = (data ?? []).slice().sort((a, b) => {
          const da = (a.created_at || a.fecha_envio || "")!;
          const db = (b.created_at || b.fecha_envio || "")!;
          return da < db ? 1 : da > db ? -1 : 0;
        });
        setItems(sorted);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "No se pudo cargar");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const solicitudesActivas = items.length;
  const montoPendiente = "Q 0"; // Si tu API devuelve montos, cámbialo aquí.
  const proximoVenc = getProximoVencimiento(items);
  const pagosRealizados = 0; // Igual: ajústalo cuando tengas ese dato.

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Inicio</h1>
        <p className="text-sm text-neutral-400">
          Resumen de tu actividad y accesos rápidos.
        </p>
      </div>

      {/* KPIs */}
      <section
        aria-label="Indicadores"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Kpi title="Solicitudes activas" value={solicitudesActivas} />
        <Kpi title="Monto pendiente" value={montoPendiente} />
        <Kpi title="Próximo vencimiento" value={proximoVenc} />
        <Kpi title="Pagos realizados" value={pagosRealizados} />
      </section>

      {/* Actividad reciente */}
      <section
        aria-label="Actividad reciente"
        className="rounded-2xl border border-white/10 bg-white/5"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold">Actividad reciente</h2>
          <Link
            href="/dashboard/solicitudes"
            className="text-sm text-blue-400 hover:underline"
          >
            Ver todo
          </Link>
        </div>

        {/* Contenido */}
        <div className="divide-y divide-white/10 text-sm">
          {/* Cabecera de tabla */}
          <header className="grid grid-cols-12 gap-2 px-4 py-2 text-neutral-400">
            <div className="col-span-5 sm:col-span-4">Solicitud</div>
            <div className="col-span-2">Código</div>
            <div className="col-span-3 sm:col-span-3">Estado</div>
            <div className="col-span-2 text-right sm:text-left sm:col-span-3">
              Fecha
            </div>
          </header>

          {/* Estados */}
          {loading && (
            <div className="px-4 py-6 text-neutral-400">Cargando…</div>
          )}
          {error && !loading && (
            <div className="px-4 py-6 text-red-400">{error}</div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="px-4 py-6 text-neutral-400">Sin movimientos.</div>
          )}

          {/* Filas */}
          {!loading &&
            !error &&
            items.slice(0, 5).map((s) => (
              <Row key={s.id_solicitud} s={s} />
            ))}
        </div>
      </section>
    </div>
  );
}

/* ===== UI bits ===== */
function Kpi({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Row({ s }: { s: Solicitud }) {
  const fecha = formatDate(s.created_at || s.fecha_envio || s.fecha_vencimiento);
  return (
    <article className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-white/5">
      <div className="col-span-5 sm:col-span-4">
        <Link
          href={`/dashboard/solicitudes/${s.id_solicitud}`}
          className="font-medium hover:underline"
        >
          #{s.id_solicitud}
        </Link>
      </div>
      <div className="col-span-2">{s.codigo ?? "—"}</div>
      <div className="col-span-3 sm:col-span-3">{s.estado ?? "—"}</div>
      <div className="col-span-2 text-right sm:text-left sm:col-span-3">
        {fecha}
      </div>
    </article>
  );
}
