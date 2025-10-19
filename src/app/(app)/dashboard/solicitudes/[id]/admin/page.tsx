"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  obtenerSolicitudDetalleAdmin,
  evaluarArticulo,
  cambiarEstadoSolicitud,
  type SolicitudDetalleAdmin,
  type EvaluarArticuloPayload,
} from "@/app/services/adminSolicitudes";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  ChevronDown,
} from "lucide-react";

/* =========================================================================
   Helpers de formato y estado
   -------------------------------------------------------------------------
   - Se centralizan funciones puras de formato (fecha, normalización).
   - Se evita duplicar lógica y se asegura consistencia visual.
   ========================================================================= */
const fmtDate = (d?: string | null): string => {
  // Devuelve em dash cuando no hay valor o fecha inválida, para no romper UI.
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Normaliza cadenas a minúsculas y remueve acentos; tolera null/undefined.
const norm = (s?: string | null): string =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Determina si un estado es "pendiente" (para habilitar acciones).
const isPendiente = (s?: string | null): boolean => norm(s) === "pendiente";

// El backend marca el artículo como "evaluado" cuando está aprobado.
// Visualmente se muestra como aprobado (verde).
const isArticuloAprobadoVisual = (s?: string | null): boolean => {
  const e = norm(s);
  return e === "evaluado" || e === "aprobado";
};

const isArticuloRechazado = (s?: string | null): boolean => norm(s) === "rechazado";

// Devuelve clases de estilo del chip del artículo según estado.
const badgeArticulo = (s?: string | null): string => {
  if (isArticuloAprobadoVisual(s))
    return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (isArticuloRechazado(s))
    return "border border-red-500/30 bg-red-500/10 text-red-300";
  return "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
};

// Devuelve el ícono adecuado según el estado del artículo.
const iconArticulo = (s?: string | null): React.ReactElement => {
  if (isArticuloAprobadoVisual(s)) return <CheckCircle2 className="size-3" />;
  if (isArticuloRechazado(s)) return <XCircle className="size-3" />;
  return <Clock className="size-3" />;
};

// Devuelve clases de estilo del chip de la solicitud según estado.
const badgeSolicitud = (s?: string | null): string => {
  const e = norm(s);
  if (e === "evaluada")
    return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (e === "rechazada")
    return "border border-red-500/30 bg-red-500/10 text-red-300";
  if (e === "en_revision")
    return "border border-blue-500/30 bg-blue-500/10 text-blue-300";
  return "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
};

// Mapea la intención de UI a los valores aceptados por la API para la SOLICITUD.
const mapEstadoSolicitudUIToAPI = (
  ui: "aprobada" | "rechazada"
): "evaluada" | "rechazada" => (ui === "aprobada" ? "evaluada" : "rechazada");

/* =========================================================================
   Page Component (AdminSolicitudDetallePage)
   -------------------------------------------------------------------------
   - Página de detalle administrativo de una solicitud.
   - Se prioriza robustez: control de errores y estados de carga/envío.
   - No se usan `any`; se tipan utilidades y callbacks.
   ========================================================================= */
export default function AdminSolicitudDetallePage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  // Estado local: carga, error, datos y "submitting" para deshabilitar botones.
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<SolicitudDetalleAdmin | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Se define la carga con useCallback para reutilizarla tras acciones (reload).
  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!Number.isFinite(id)) {
        setError("ID inválido");
        setData(null);
        return;
      }
      const d = await obtenerSolicitudDetalleAdmin(id);
      setData(d);
    } catch (e: unknown) {
      setError(getErrMsg(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Al montar o cambiar el id, se dispara la carga.
  React.useEffect(() => {
    void load();
  }, [load]);

  // Cambia el estado de la solicitud completo (aprobada/rechazada).
  async function onCambiarEstado(uiNuevo: "aprobada" | "rechazada"): Promise<void> {
    if (!data) return;
    const apiNuevo = mapEstadoSolicitudUIToAPI(uiNuevo);
    const ok = confirm(
      `¿Cambiar el estado de la solicitud #${data.id_solicitud} a "${uiNuevo}"? (API: "${apiNuevo}")`
    );
    if (!ok) return;
    try {
      setSubmitting(true);
      await cambiarEstadoSolicitud(data.id_solicitud, apiNuevo);
      await load();
    } catch (e: unknown) {
      alert(getErrMsg(e));
    } finally {
      setSubmitting(false);
    }
  }

  // Wrapper para evaluar un artículo (aprobar/rechazar) y refrescar.
  async function onEvaluarArticuloWrapper(
    id_articulo: number,
    payload: EvaluarArticuloPayload
  ): Promise<void> {
    try {
      setSubmitting(true);
      await evaluarArticulo(id_articulo, payload);
      await load();
    } catch (e: unknown) {
      alert(getErrMsg(e));
    } finally {
      setSubmitting(false);
    }
  }

  /* -------------------------------------
     Estados de interfaz: Cargando / Error
     ------------------------------------- */
  if (loading) {
    // Mientras carga, se muestra un spinner central para feedback claro.
    return (
      <div className="grid place-items-center py-16 text-neutral-400">
        <Loader2 className="mr-2 size-6 animate-spin" />
        Cargando…
      </div>
    );
  }

  if (error || !data) {
    // En error o sin datos, se ofrece navegación para volver al listado.
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/dashboard/solicitudes")}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        <div className="flex items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-red-400">
          <AlertCircle className="mr-2 size-5" />
          {error ?? "No se pudo cargar la solicitud."}
        </div>
      </div>
    );
  }

  // Si hay datos, se desestructura para uso más legible.
  const { cliente, articulos, resumen } = data;

  return (
    <div className="space-y-6">
      {/* ===========================================================
          Encabezado con acciones de solicitud (aprobar / rechazar)
          =========================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/solicitudes")}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <ArrowLeft className="size-4" />
            Volver
          </button>
          <h1 className="text-xl font-semibold">Solicitud #{data.id_solicitud}</h1>
          <span
            className={`rounded-md px-2 py-0.5 text-xs capitalize ${badgeSolicitud(
              data.estado
            )}`}
          >
            {data.estado ?? "pendiente"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={submitting}
            onClick={() => onCambiarEstado("aprobada")}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" />
            Aprobar
          </button>
          <button
            disabled={submitting}
            onClick={() => onCambiarEstado("rechazada")}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            <XCircle className="size-4" />
            Rechazar
          </button>
        </div>
      </div>

      {/* ===========================================================
          Datos del cliente + Resumen de artículos
          =========================================================== */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Datos del cliente</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-neutral-400">Nombre</div>
              <div className="text-sm font-medium">{cliente.nombre}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Correo</div>
              <div className="text-sm">{cliente.correo}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Teléfono</div>
              <div className="text-sm">{cliente.telefono ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Dirección</div>
              <div className="text-sm">{cliente.direccion ?? "—"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Resumen</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Total artículos</span>
              <span className="font-semibold">{resumen.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-300">Aprobados</span>
              <span className="font-semibold text-emerald-300">{resumen.aprobados}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-300">Pendientes</span>
              <span className="font-semibold text-yellow-300">{resumen.pendientes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-300">Rechazados</span>
              <span className="font-semibold text-red-300">{resumen.rechazados}</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-neutral-400">
            Envío: {fmtDate(data.fecha_envio)} · Método: {data.metodo_entrega}
          </div>
        </div>
      </div>

      {/* ===========================================================
          Listado de artículos con acciones (aprobar / rechazar)
          =========================================================== */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Package className="size-4 text-blue-300" />
          <h2 className="font-semibold">Artículos</h2>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-neutral-300">
            {articulos.length}
          </span>
        </div>

        <div className="space-y-3">
          {articulos.map((a) => {
            const puedeAprobar = isPendiente(a.estado);
            return (
              <div
                key={a.id_articulo}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">
                        #{a.id_articulo}
                      </span>
                      <span className="text-sm font-medium capitalize">
                        {a.tipo_nombre ?? "Artículo"}
                      </span>
                      {a.condicion && (
                        <span className="text-xs capitalize text-neutral-400">
                          · {a.condicion}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-neutral-300">{a.descripcion}</p>

                    <div className="mt-2 text-xs text-neutral-400">
                      Valor estimado:{" "}
                      <span className="font-mono">Q {a.valor_estimado}</span>
                      {a.valor_aprobado != null && (
                        <>
                          {" "}
                          · Valor aprobado:{" "}
                          <span className="font-mono text-emerald-300">
                            Q {a.valor_aprobado}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${badgeArticulo(
                        a.estado
                      )}`}
                    >
                      {iconArticulo(a.estado)}
                      {/* Se muestra el texto tal cual llega del backend */}
                      {a.estado ?? "pendiente"}
                    </span>

                    {puedeAprobar && (
                      <>
                        <button
                          disabled={submitting}
                          onClick={() =>
                            onEvaluarArticuloWrapper(a.id_articulo, {
                              accion: "aprobar",
                              // Se sugiere valor estimado como base; en el futuro podría abrirse un modal.
                              valor_aprobado: a.valor_estimado ?? 0,
                              plazo_dias: 30,
                            })
                          }
                          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          Aprobar
                        </button>

                        <button
                          disabled={submitting}
                          onClick={() =>
                            onEvaluarArticuloWrapper(a.id_articulo, {
                              accion: "rechazar",
                              motivo_rechazo: "No cumple requisitos",
                            })
                          }
                          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Bloque de fotos (colapsable) */}
                {a.fotos?.length ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-neutral-400">
                      Ver fotos <ChevronDown className="ml-1 inline size-3" />
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {a.fotos.map((f) => (
                        <div
                          key={f.id_foto}
                          className="overflow-hidden rounded-lg border border-white/10"
                        >
                          <Image
                            src={f.url}
                            alt={`Foto ${f.id_foto}`}
                            width={160}
                            height={120}
                            className="h-[120px] w-[160px] object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Utilidades de error tipadas (sin `any`)
   -------------------------------------------------------------------------
   - Se define un type guard para objetos con `message` string.
   - Evita usar "as any" y satisface `@typescript-eslint/no-explicit-any`.
   ========================================================================= */
function isRecordWithMessage(value: unknown): value is { message: string } {
  if (typeof value !== "object" || value === null) return false;
  // Se usa acceso seguro vía Record<string, unknown> para no caer en `any`.
  const rec = value as Record<string, unknown>;
  return typeof rec.message === "string";
}

function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isRecordWithMessage(err)) return err.message;
  return "Error desconocido";
}
