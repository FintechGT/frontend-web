"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft, FileText, ExternalLink, BadgeCheck } from "lucide-react";
import {
  obtenerPrestamoDetalleCompleto,
  type PrestamoDetalleCompleto,
  type PagoItem,
  type MovimientoItem,
} from "@/app/services/prestamos";

export default function PrestamoDetallePage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = React.useState<PrestamoDetalleCompleto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const detalle = await obtenerPrestamoDetalleCompleto(Number(id));
      setData(detalle);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al cargar el préstamo.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-neutral-400">
        <Loader2 className="mr-2 size-6 animate-spin" />
        Cargando préstamo…
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <ChevronLeft className="size-4" />
            Volver
          </button>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {err}
        </div>
      </div>
    );
  }

  if (!data) return <></>;

  const badgeClass =
    data.estado.nombre === "activo"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : data.estado.nombre.includes("mora")
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-blue-500/30 bg-blue-500/10 text-blue-300";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <ChevronLeft className="size-4" />
            Volver
          </button>
          <h1 className="text-xl font-semibold">Préstamo #{data.id_prestamo}</h1>
          <span className={`rounded-md border px-2 py-0.5 text-xs capitalize ${badgeClass}`}>
            {data.estado.nombre}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/prestamos"
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            Listado
          </Link>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Resumen">
          <ul className="space-y-1 text-sm">
            <li>
              <b>Monto:</b> Q {Number(data.monto_prestamo).toLocaleString()}
            </li>
            <li>
              <b>Deuda actual:</b>{" "}
              <span className="font-medium text-amber-200">
                Q {Number(data.deuda_actual).toLocaleString()}
              </span>
            </li>
            <li>
              <b>Interés acum.:</b> Q {Number(data.interes_acumulada).toLocaleString()}
            </li>
            <li>
              <b>Mora acum.:</b> Q {Number(data.mora_acumulada).toLocaleString()}
            </li>
            <li>
              <b>Inicio:</b> {data.fecha_inicio}
            </li>
            <li>
              <b>Vence:</b> {data.fecha_vencimiento} ({data.dias_mora} días de mora)
            </li>
            <li>
              <b>Total pagado (validados):</b> Q {Number(data.total_pagado).toLocaleString()}
            </li>
          </ul>
        </Card>

        <Card title="Artículo">
          <div className="text-sm">
            <div className="mb-1">
              <b>Tipo:</b> {data.articulo.tipo_nombre ?? `#${data.articulo.id_tipo}`}
            </div>
            <div className="mb-1">
              <b>Descripción:</b> {data.articulo.descripcion}
            </div>
            <div className="mb-1">
              <b>Estado art.:</b> {data.articulo.estado}
            </div>
            <div className="mb-1">
              <b>Valor estimado:</b> Q {Number(data.articulo.valor_estimado).toLocaleString()}
            </div>
            {data.articulo.valor_aprobado != null && (
              <div className="mb-1">
                <b>Valor aprobado:</b> Q {Number(data.articulo.valor_aprobado).toLocaleString()}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {data.articulo.fotos?.slice(0, 3).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`foto ${i + 1}`}
                  className="h-16 w-16 rounded-md object-cover ring-1 ring-white/10"
                />
              ))}
            </div>
          </div>
        </Card>

        <Card title="Cliente / Contrato">
          <div className="space-y-2 text-sm">
            {data.cliente ? (
              <>
                <div>
                  <b>Cliente:</b> {data.cliente.nombre}
                </div>
                <div className="text-neutral-400">{data.cliente.correo}</div>
                {data.cliente.telefono && <div>Tel: {data.cliente.telefono}</div>}
              </>
            ) : (
              <div className="text-neutral-400">Datos de cliente no visibles para tu rol.</div>
            )}

            {data.contrato ? (
              <Link
                href={data.contrato.url_pdf}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-blue-300 hover:bg-white/5"
              >
                <FileText className="size-4" />
                Abrir contrato
                <ExternalLink className="size-3" />
              </Link>
            ) : (
              <div className="text-neutral-400">Sin contrato.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Pagos */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Pagos</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-12 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-neutral-400">
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-2">Monto</div>
            <div className="col-span-2">Medio</div>
            <div className="col-span-3">Referencia</div>
            <div className="col-span-1 text-right">Comprob.</div>
          </div>
          <div className="divide-y divide-white/10">
            {data.pagos.length === 0 && (
              <div className="p-6 text-center text-sm text-neutral-400">
                Este préstamo no tiene pagos.
              </div>
            )}
            {data.pagos.map((p: PagoItem) => (
              <div key={p.id_pago} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-2 font-mono">{p.fecha_pago ?? "—"}</div>
                <div className="col-span-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs capitalize ${
                      p.estado === "validado"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : p.estado === "pendiente"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-neutral-500/30 bg-neutral-500/10 text-neutral-300"
                    }`}
                  >
                    {p.estado}
                  </span>
                </div>
                <div className="col-span-2">Q {Number(p.monto).toLocaleString()}</div>
                <div className="col-span-2">{p.medio_pago ?? "—"}</div>
                <div className="col-span-3 font-mono text-xs">{p.ref_bancaria ?? "—"}</div>
                <div className="col-span-1 text-right">{p.comprobantes?.length ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Movimientos (si el backend los incluyó para roles admin) */}
      {Array.isArray(data.movimientos) && data.movimientos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Movimientos</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-12 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-neutral-400">
              <div className="col-span-3">Fecha</div>
              <div className="col-span-3">Tipo</div>
              <div className="col-span-3">Monto</div>
              <div className="col-span-3">Nota</div>
            </div>
            <div className="divide-y divide-white/10">
              {data.movimientos.map((m: MovimientoItem) => (
                <div key={m.id_mov} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                  <div className="col-span-3 font-mono">{m.fecha}</div>
                  <div className="col-span-3 capitalize">{m.tipo}</div>
                  <div className="col-span-3">Q {Number(m.monto).toLocaleString()}</div>
                  <div className="col-span-3 text-xs text-neutral-300">{m.nota ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Estado de acciones */}
      <div className="flex items-center gap-3 text-sm text-neutral-300">
        {data.puede_pagar ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
            <BadgeCheck className="size-4" /> Acepta pagos
          </span>
        ) : (
          <span className="rounded-md border border-neutral-500/30 bg-neutral-500/10 px-2 py-1">
            Pagos no permitidos por estado
          </span>
        )}
        {data.puede_liquidar && (
          <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-blue-300">
            Puede liquidarse
          </span>
        )}
      </div>
    </div>
  );
}

/* Pequeño contenedor visual */
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <div className="mb-2 text-sm font-semibold text-neutral-200">{title}</div>
      <div className="text-neutral-300">{children}</div>
    </div>
  );
}
