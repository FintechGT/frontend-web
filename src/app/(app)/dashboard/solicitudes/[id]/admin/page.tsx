"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  obtenerSolicitudDetalleAdmin,
  aprobarArticulo,
  rechazarArticulo,
  cambiarEstadoSolicitud,
  generarContratoPrestamo,
  obtenerReglasArticulos,
  type ReglaTipoArticulo,
  type SolicitudDetalleAdmin,
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

/* ======================= Helpers ======================= */
const fmtDate = (d?: string | null): string => {
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

const norm = (s?: string | null): string =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const isPendiente = (s?: string | null): boolean => norm(s) === "pendiente";
const isEvaluada = (s?: string | null): boolean =>
  ["evaluada", "rechazada"].includes(norm(s));

const isArticuloAprobadoVisual = (s?: string | null): boolean => {
  const e = norm(s);
  return e === "evaluado" || e === "aprobado";
};
const isArticuloRechazado = (s?: string | null): boolean =>
  norm(s) === "rechazado";

const badgeArticulo = (s?: string | null): string => {
  if (isArticuloAprobadoVisual(s))
    return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (isArticuloRechazado(s))
    return "border border-red-500/30 bg-red-500/10 text-red-300";
  return "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
};

const iconArticulo = (s?: string | null): React.ReactElement => {
  if (isArticuloAprobadoVisual(s)) return <CheckCircle2 className="size-3" />;
  if (isArticuloRechazado(s)) return <XCircle className="size-3" />;
  return <Clock className="size-3" />;
};

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

const mapEstadoSolicitudUIToAPI = (
  ui: "aprobada" | "rechazada"
): "evaluada" | "rechazada" => (ui === "aprobada" ? "evaluada" : "rechazada");

type EntradaLocal = { valor: string; plazo: string; motivo: string };
type DecisionLocal =
  | { tipo: "aprobar"; valor: number; plazo_dias: number }
  | { tipo: "rechazar"; motivo: string };

function esAprobacion(
  d: DecisionLocal
): d is { tipo: "aprobar"; valor: number; plazo_dias: number } {
  return d.tipo === "aprobar";
}

// Tope permitido según reglas
function maxPermitido(
  a: { valor_estimado: number; id_tipo: number },
  reglas: Record<number, ReglaTipoArticulo>
): number | null {
  const regla = reglas[a.id_tipo];
  if (!regla || typeof regla.porcentaje_max_prestamo !== "number") return null;
  const raw = a.valor_estimado * regla.porcentaje_max_prestamo;
  return Math.round(raw * 100) / 100; // 2 decimales
}

/* ======================= Componente Principal ======================= */
export default function AdminSolicitudDetallePage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<SolicitudDetalleAdmin | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // inputs por artículo y decisiones locales
  const [inputs, setInputs] = React.useState<Record<number, EntradaLocal>>({});
  const [decisiones, setDecisiones] = React.useState<Record<number, DecisionLocal>>({});

  // reglas por tipo
  const [reglas, setReglas] = React.useState<Record<number, ReglaTipoArticulo>>({});

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

      const base: Record<number, EntradaLocal> = {};
      d.articulos.forEach((a) => {
        base[a.id_articulo] = {
          valor: a.valor_aprobado != null ? String(a.valor_aprobado) : "",
          plazo: "30",
          motivo: "",
        };
      });
      setInputs(base);
      setDecisiones({});

      // cargar reglas
      try {
        const lista = await obtenerReglasArticulos();
        const byTipo: Record<number, ReglaTipoArticulo> = {};
        for (const r of lista) byTipo[r.id_tipo] = r;
        setReglas(byTipo);
      } catch {
        setReglas({});
      }
    } catch (e: unknown) {
      setError(getErrMsg(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // total aprobado "local"
  const totalAprobadoLocal = React.useMemo(() => {
    if (!data) return 0;
    let sum = 0;
    for (const a of data.articulos) {
      const mark = decisiones[a.id_articulo];
      if (mark && esAprobacion(mark)) {
        sum += mark.valor;
      } else {
        const v = Number(inputs[a.id_articulo]?.valor);
        if (Number.isFinite(v) && v > 0) sum += v;
      }
    }
    return sum;
  }, [data, decisiones, inputs]);

  /* ----------- Marca locales por artículo ----------- */
  function marcarAprobar(id_articulo: number) {
    const inp = inputs[id_articulo];
    const valor = Number(inp?.valor);
    const plazo = Number(inp?.plazo || "30");
    if (!Number.isFinite(valor) || valor <= 0) {
      alert("Ingrese un valor aprobado válido (> 0).");
      return;
    }
    if (!Number.isFinite(plazo) || plazo <= 0) {
      alert("Plazo inválido.");
      return;
    }
    setDecisiones((p) => ({ ...p, [id_articulo]: { tipo: "aprobar", valor, plazo_dias: plazo } }));
  }

  function marcarRechazar(id_articulo: number) {
    const motivo = (inputs[id_articulo]?.motivo || "").trim();
    if (!motivo) {
      alert("Ingrese el motivo de rechazo.");
      return;
    }
    setDecisiones((p) => ({ ...p, [id_articulo]: { tipo: "rechazar", motivo } }));
  }

  function quitarMarca(id_articulo: number) {
    setDecisiones((p) => {
      const cp = { ...p };
      delete cp[id_articulo];
      return cp;
    });
  }

  /* ----------- Envío final ----------- */
  async function aprobarSolicitud(): Promise<void> {
    if (!data) return;
    if (isEvaluada(data.estado)) {
      alert("La solicitud ya está cerrada.");
      return;
    }

    // Decisiones efectivas a enviar
    const efectivas: Array<{ id: number; dec: DecisionLocal }> = [];
    for (const a of data.articulos) {
      const mark = decisiones[a.id_articulo];
      if (mark) {
        efectivas.push({ id: a.id_articulo, dec: mark });
      } else {
        const v = Number(inputs[a.id_articulo]?.valor);
        const p = Number(inputs[a.id_articulo]?.plazo || "30");
        if (Number.isFinite(v) && v > 0) {
          efectivas.push({ id: a.id_articulo, dec: { tipo: "aprobar", valor: v, plazo_dias: p } });
        }
      }
    }

    if (efectivas.length === 0) {
      alert("No hay decisiones/montos para enviar.");
      return;
    }

    // Validar contra reglas (tope máximo)
    for (const e of efectivas) {
      const art = data.articulos.find((a) => a.id_articulo === e.id);
      if (!art) continue;
      const max = maxPermitido(art, reglas);
      if (max != null && esAprobacion(e.dec) && e.dec.valor > max) {
        alert(
          `El artículo #${e.id} excede el máximo permitido.\n` +
            `Tope: Q ${max.toFixed(2)} · Valor ingresado: Q ${e.dec.valor.toFixed(2)}`
        );
        return;
      }
    }

    const total = efectivas.reduce((s, e) => (esAprobacion(e.dec) ? s + e.dec.valor : s), 0);

    const ok = confirm(
      `Se enviarán ${efectivas.length} decisiones.\nTotal aprobado: Q ${total.toFixed(
        2
      )}.\n¿Confirmar?`
    );
    if (!ok) return;

    try {
      setSubmitting(true);

      // Guardar ids de préstamos aprobados para generar contrato
      const prestamosAprobados: number[] = [];

      // 1) enviar cada decisión SOLO si el artículo sigue pendiente (evita 409)
      for (const e of efectivas) {
        const art = data.articulos.find((a) => a.id_articulo === e.id);
        if (!art) continue;

        if (!isPendiente(art.estado)) continue;

        if (esAprobacion(e.dec)) {
          const resp = await aprobarArticulo(e.id, {
            valor_aprobado: e.dec.valor,
            plazo_dias: e.dec.plazo_dias,
          });
          if (resp?.prestamo?.id_prestamo) {
            prestamosAprobados.push(resp.prestamo.id_prestamo);
          }
        } else {
          await rechazarArticulo(e.id, { motivo: e.dec.motivo });
        }
      }

      // 2) Generar contrato para cada préstamo aprobado (no activar)
      let contratosOk = 0;
      for (const id_prestamo of prestamosAprobados) {
        try {
          await generarContratoPrestamo(id_prestamo);
          contratosOk++;
        } catch (err) {
          console.warn("No se pudo generar contrato para", id_prestamo, err);
        }
      }
      if (prestamosAprobados.length > 0) {
        alert(
          `Contrato(s) generado(s): ${contratosOk}/${prestamosAprobados.length}.\n` +
            `Los préstamo(s) quedan en "aprobado_pendiente_entrega".\n` +
            `Se activarán más adelante cuando el contrato esté firmado y se registre la fecha de desembolso.`
        );
      }

      // 3) estado de solicitud según si hay aprobados
      const hayAprobados = efectivas.some((e) => e.dec.tipo === "aprobar");
      await cambiarEstadoSolicitud(
        data.id_solicitud,
        mapEstadoSolicitudUIToAPI(hayAprobados ? "aprobada" : "rechazada")
      );

      alert("Solicitud actualizada correctamente.");
      await load();
    } catch (e: unknown) {
      alert(getErrMsg(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function rechazarSolicitud(): Promise<void> {
    if (!data) return;
    if (isEvaluada(data.estado)) {
      alert("La solicitud ya está cerrada.");
      return;
    }
    const motivo = prompt("Motivo del rechazo de la solicitud:");
    if (!motivo) return;

    try {
      setSubmitting(true);
      await cambiarEstadoSolicitud(data.id_solicitud, "rechazada");
      alert("Solicitud rechazada.");
      await load();
    } catch (e: unknown) {
      alert(getErrMsg(e));
    } finally {
      setSubmitting(false);
    }
  }

  /* ----------- UI ----------- */
  if (loading)
    return (
      <div className="grid place-items-center py-16 text-neutral-400">
        <Loader2 className="mr-2 size-6 animate-spin" /> Cargando…
      </div>
    );

  if (error || !data)
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/dashboard/solicitudes")}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <ArrowLeft className="size-4" /> Volver
        </button>
        <div className="flex items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-red-400">
          <AlertCircle className="mr-2 size-5" />
          {error ?? "No se pudo cargar la solicitud."}
        </div>
      </div>
    );

  const { cliente, articulos, resumen } = data;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/solicitudes")}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <ArrowLeft className="size-4" /> Volver
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

        {/* Acciones top */}
        {!isEvaluada(data.estado) && (
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm">
              <span className="text-neutral-400">Total aprobado (local): </span>
              <span className="font-semibold text-emerald-300">
                Q {totalAprobadoLocal.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={submitting}
                onClick={aprobarSolicitud}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                Aprobar solicitud
              </button>
              <button
                disabled={submitting}
                onClick={rechazarSolicitud}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-50"
              >
                <XCircle className="size-4" />
                Rechazar solicitud
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Datos cliente + resumen */}
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

      {/* Artículos (con controles) */}
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
            const pendiente = isPendiente(a.estado);
            const mark = decisiones[a.id_articulo];
            const max = maxPermitido(a, reglas);
            const valorNum = Number(inputs[a.id_articulo]?.valor);
            const excede = Number.isFinite(valorNum) && max != null && valorNum > max;

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
                        <span className="text-xs capitalize text-neutral-400">· {a.condicion}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-neutral-300">{a.descripcion}</p>
                    <div className="mt-2 text-xs text-neutral-400">
                      Valor estimado: <span className="font-mono">Q {a.valor_estimado}</span>
                      {a.valor_aprobado != null && (
                        <>
                          {" "}
                          · Valor aprobado:{" "}
                          <span className="font-mono text-emerald-300">Q {a.valor_aprobado}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${badgeArticulo(
                      a.estado
                    )}`}
                  >
                    {iconArticulo(a.estado)}
                    {a.estado ?? "pendiente"}
                  </span>
                </div>

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

                {/* Controles locales */}
                <div className="mt-4 grid gap-1 sm:grid-cols-3">
                  <label className="grid gap-1 text-xs">
                    <span className="text-neutral-300">Valor aprobado (Q)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inputs[a.id_articulo]?.valor ?? ""}
                      onChange={(e) =>
                        setInputs((p) => ({
                          ...p,
                          [a.id_articulo]: {
                            ...(p[a.id_articulo] || { plazo: "30", motivo: "" }),
                            valor: e.target.value,
                          },
                        }))
                      }
                      disabled={!pendiente || submitting}
                      className={`rounded-lg bg-neutral-900 px-3 py-2 text-sm border outline-none disabled:opacity-50
                        ${excede ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-emerald-500"}`}
                    />
                    {max != null && (
                      <span className={`mt-0.5 ${excede ? "text-red-300" : "text-neutral-400"}`}>
                        Máximo permitido:{" "}
                        <span className="font-mono">Q {max.toFixed(2)}</span>
                        {excede ? " · excede el tope" : ""}
                      </span>
                    )}
                  </label>

                  <label className="grid gap-1 text-xs">
                    <span className="text-neutral-300">Plazo (días)</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={inputs[a.id_articulo]?.plazo ?? "30"}
                      onChange={(e) =>
                        setInputs((p) => ({
                          ...p,
                          [a.id_articulo]: {
                            ...(p[a.id_articulo] || { valor: "", motivo: "" }),
                            plazo: e.target.value,
                          },
                        }))
                      }
                      disabled={!pendiente || submitting}
                      className="rounded-lg bg-neutral-900 px-3 py-2 text-sm border border-white/10 outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </label>

                  <label className="grid gap-1 text-xs">
                    <span className="text-neutral-300">Motivo de rechazo</span>
                    <input
                      type="text"
                      value={inputs[a.id_articulo]?.motivo ?? ""}
                      onChange={(e) =>
                        setInputs((p) => ({
                          ...p,
                          [a.id_articulo]: {
                            ...(p[a.id_articulo] || { valor: "", plazo: "30" }),
                            motivo: e.target.value,
                          },
                        }))
                      }
                      disabled={!pendiente || submitting}
                      placeholder="Completar si vas a rechazar"
                      className="rounded-lg bg-neutral-900 px-3 py-2 text-sm border border-white/10 outline-none focus:border-red-500 disabled:opacity-50"
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => marcarAprobar(a.id_articulo)}
                    disabled={!pendiente || submitting || (max != null && excede)}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-4" />
                    Marcar aprobar
                  </button>

                  <button
                    onClick={() => marcarRechazar(a.id_articulo)}
                    disabled={!pendiente || submitting}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <XCircle className="size-4" />
                    Marcar rechazo
                  </button>

                  {mark && (
                    <button
                      onClick={() => quitarMarca(a.id_articulo)}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/5"
                    >
                      Quitar marca
                    </button>
                  )}

                  {mark && esAprobacion(mark) && (
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                      Marcado: aprobar Q {mark.valor} · {mark.plazo_dias} días
                    </span>
                  )}
                  {mark && !esAprobacion(mark) && (
                    <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                      Marcado: rechazar — {mark.motivo}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function isRecordWithMessage(value: unknown): value is { message: string } {
  if (typeof value !== "object" || value === null) return false;
  const rec = value as Record<string, unknown>;
  return typeof rec.message === "string";
}

function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isRecordWithMessage(err)) return err.message;
  return "Error desconocido";
}
