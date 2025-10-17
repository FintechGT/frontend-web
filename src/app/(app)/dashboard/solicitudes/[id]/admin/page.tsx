// src/app/(app)/dashboard/solicitudes/[id]/admin/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

/* ====== Tipos (compatibles con tu backend) ====== */

type ArticuloFotoAdmin = {
  id_foto: number;
  url: string;
  orden: number;
};

type ArticuloDetalleAdmin = {
  id_articulo: number;
  id_tipo: number;
  tipo_nombre?: string | null;
  descripcion: string;
  valor_estimado: number;
  valor_aprobado?: number | null;
  condicion?: string | null;
  estado: string; // "pendiente" | "evaluado" | "rechazado" | ...
  fotos: ArticuloFotoAdmin[];
  tiene_prestamo: boolean;
  prestamo_id?: number | null;
  prestamo_estado?: string | null;
};

type ClienteInfoAdmin = {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
};

type SolicitudDetalleAdmin = {
  id_solicitud: number;
  estado: string;
  fecha_envio: string | null;
  metodo_entrega: string | null;
  direccion_entrega?: string | null;
  cliente: ClienteInfoAdmin;
  articulos: ArticuloDetalleAdmin[];
  resumen: { total: number; aprobados: number; rechazados: number; pendientes: number };
};

type EvaluarIn =
  | { accion: "aprobar"; valor_aprobado: number; plazo_dias?: number }
  | { accion: "rechazar"; motivo_rechazo: string };

/* ====== Helpers ====== */

function money(n?: number | null) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "GTQ" });
}

function dmy(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
}

/* ====== Página ====== */

export default function SolicitudAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const solId = Number(id);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<SolicitudDetalleAdmin | null>(null);
  const [busyArt, setBusyArt] = React.useState<number | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!Number.isFinite(solId)) {
      setError("ID inválido"); setLoading(false); return;
    }
    try {
      setLoading(true); setError(null);
      const r = await api.get<SolicitudDetalleAdmin>(`/admin/solicitudes/${solId}`);
      setData(r.data);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar la solicitud");
    } finally {
      setLoading(false);
    }
  }, [solId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  async function evaluarArticulo(id_articulo: number, payload: EvaluarIn) {
    try {
      setBusyArt(id_articulo);
      await api.post(`/admin/solicitudes/articulos/${id_articulo}/evaluar`, payload);
      // refrescar local sin volver a pedir todo:
      setData((prev) => {
        if (!prev) return prev;
        const next = { ...prev, articulos: prev.articulos.map(a => ({ ...a })) };
        const a = next.articulos.find(x => x.id_articulo === id_articulo);
        if (!a) return prev;

        if (payload.accion === "aprobar") {
          a.estado = "evaluado";
          a.valor_aprobado = (payload as any).valor_aprobado;
        } else {
          a.estado = "rechazado";
          a.valor_aprobado = null;
        }

        // actualizar contadores
        const counts = { total: next.resumen.total, aprobados: 0, rechazados: 0, pendientes: 0 };
        for (const it of next.articulos) {
          if (it.estado?.toLowerCase() === "evaluado") counts.aprobados++;
          else if (it.estado?.toLowerCase() === "rechazado") counts.rechazados++;
          else counts.pendientes++;
        }
        next.resumen = counts;
        return next;
      });
    } catch (e: any) {
      alert(e?.message ?? "No se pudo evaluar el artículo");
    } finally {
      setBusyArt(null);
    }
  }

  function onAprobar(a: ArticuloDetalleAdmin) {
    const def = Math.max(0, Math.floor(a.valor_estimado || 0));
    const v = prompt(`Valor aprobado para "${a.descripcion}"`, String(def));
    if (v == null) return;
    const monto = Number(v);
    if (!Number.isFinite(monto) || monto < 0) {
      alert("Monto inválido"); return;
    }
    const plazoStr = prompt("Plazo (días)", "30");
    const plazo = Number(plazoStr ?? "30") || 30;
    evaluarArticulo(a.id_articulo, { accion: "aprobar", valor_aprobado: monto, plazo_dias: plazo });
  }

  function onRechazar(a: ArticuloDetalleAdmin) {
    const motivo = prompt(`Motivo de rechazo para "${a.descripcion}"`);
    if (!motivo) return;
    evaluarArticulo(a.id_articulo, { accion: "rechazar", motivo_rechazo: motivo });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2 py-8 text-neutral-300">
          <RefreshCw className="size-4 animate-spin" /> Cargando…
        </div>
      </div>
    );
    }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/solicitudes")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <ArrowLeft className="size-4" />
            Volver
          </button>
          <h1 className="text-xl font-semibold">Solicitud #{solId}</h1>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/solicitudes")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
        <h1 className="text-xl font-semibold">Solicitud #{data.id_solicitud} (Admin)</h1>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">
          {data.estado}
        </span>
        <div className="ml-auto">
          <Link
            href={`/dashboard/solicitudes/${data.id_solicitud}`}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
            title="Ver vista de usuario"
          >
            Vista de usuario
          </Link>
        </div>
      </div>

      {/* Cliente */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="font-semibold">{data.cliente.nombre}</div>
          <div className="text-neutral-400 text-sm">ID: {data.cliente.id_usuario}</div>
          <div className="text-neutral-400 text-sm">Correo: {data.cliente.correo}</div>
          {data.cliente.telefono && <div className="text-neutral-400 text-sm">Tel: {data.cliente.telefono}</div>}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-neutral-400">Total artículos</div>
          <div className="mt-1 text-2xl font-semibold">{data.resumen.total}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="text-sm text-neutral-300">Aprobados</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-400">{data.resumen.aprobados}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="text-sm text-neutral-300">Pendientes</div>
          <div className="mt-1 text-2xl font-semibold text-amber-300">{data.resumen.pendientes}</div>
        </div>
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="text-sm text-neutral-300">Rechazados</div>
          <div className="mt-1 text-2xl font-semibold text-rose-400">{data.resumen.rechazados}</div>
        </div>
      </div>

      {/* Info solicitud */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-neutral-400">Método de entrega</dt>
            <dd className="mt-0.5 capitalize">{data.metodo_entrega ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Fecha de envío</dt>
            <dd className="mt-0.5">{dmy(data.fecha_envio)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-neutral-400">Dirección</dt>
            <dd className="mt-0.5 break-words">{data.direccion_entrega ?? "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Artículos */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Artículos</h2>

        {data.articulos.map((a) => {
          const estado = (a.estado || "").toLowerCase();
          const isPend = estado === "pendiente";
          return (
            <div key={a.id_articulo} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium">{a.descripcion}</div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">
                  {a.estado}
                </span>
                <div className="ml-auto text-sm text-neutral-400">
                  Estimado: {money(a.valor_estimado)}{" "}
                  {a.valor_aprobado != null && (
                    <span className="ml-3">Aprobado: {money(a.valor_aprobado)}</span>
                  )}
                </div>
              </div>

              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-neutral-400">Tipo</dt>
                  <dd className="mt-0.5">{a.tipo_nombre ?? `#${a.id_tipo}`}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Condición</dt>
                  <dd className="mt-0.5 capitalize">{a.condicion ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Préstamo</dt>
                  <dd className="mt-0.5">
                    {a.tiene_prestamo
                      ? `#${a.prestamo_id} · ${a.prestamo_estado ?? ""}`
                      : "—"}
                  </dd>
                </div>
              </dl>

              {/* Fotos */}
              <div className="mt-3">
                <div className="mb-2 text-sm text-neutral-400">
                  Fotos ({a.fotos?.length ?? 0})
                </div>
                {a.fotos?.length ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {a.fotos
                      .slice()
                      .sort((x, y) => (x.orden ?? 0) - (y.orden ?? 0))
                      .map((f) => (
                        <a
                          key={f.id_foto}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                          title="Abrir en pestaña nueva"
                        >
                          <img
                            src={f.url}
                            alt="Foto de artículo"
                            loading="lazy"
                            className="h-28 w-full rounded-xl object-cover"
                          />
                        </a>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-neutral-400">
                    Sin fotos
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  disabled={!isPend || busyArt === a.id_articulo}
                  onClick={() => onAprobar(a)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="size-4" />
                  Aprobar
                </button>
                <button
                  disabled={!isPend || busyArt === a.id_articulo}
                  onClick={() => onRechazar(a)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm text-white disabled:opacity-50 hover:bg-rose-700"
                >
                  <XCircle className="size-4" />
                  Rechazar
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
