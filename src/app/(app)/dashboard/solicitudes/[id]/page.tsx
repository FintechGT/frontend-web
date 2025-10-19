"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";

/* ==================== Tipos ==================== */
type Foto = {
  id_foto: number;
  url: string;
};

type Articulo = {
  id_articulo: number;
  descripcion: string;
  tipo_nombre?: string | null;
  condicion?: string | null;
  estado?: "aprobado" | "rechazado" | "pendiente" | string | null;
  valor_estimado?: number | null;
  valor_aprobado?: number | null;
  fotos?: Foto[] | null;
};

type SolicitudDetalle = {
  id_solicitud: number;
  estado?: "pendiente" | "aprobada" | "rechazada" | string | null;
  fecha_envio?: string | null;
  metodo_entrega?: string | null;
  direccion_entrega?: string | null;
  articulos: Articulo[];
};

/* ==================== Helpers robustos ==================== */
const fmtDate = (d?: string | null) => {
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

const fmtMoney = (n?: number | null) =>
  typeof n === "number" ? `Q ${n.toLocaleString()}` : "—";

// normaliza, quita acentos y pasa a minúsculas; tolera null/undefined
const norm = (s?: string | null) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const badgeByEstado = (estado?: string | null) => {
  const e = norm(estado);
  if (e.startsWith("aproba"))
    return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (e.startsWith("rechaza"))
    return "border border-red-500/30 bg-red-500/10 text-red-300";
  return "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
};

const iconByEstado = (estado?: string | null) => {
  const e = norm(estado);
  if (e.startsWith("aproba")) return <CheckCircle2 className="size-3" />;
  if (e.startsWith("rechaza")) return <XCircle className="size-3" />;
  return <Clock className="size-3" />;
};

function buildResumen(articulos: Articulo[]) {
  let aprobados = 0,
    rechazados = 0,
    pendientes = 0,
    sumEstimado = 0,
    sumAprobado = 0;

  for (const a of articulos) {
    const e = norm(a.estado);
    if (e === "aprobado" || e === "aprobada") aprobados++;
    else if (e === "rechazado" || e === "rechazada") rechazados++;
    else pendientes++;

    if (typeof a.valor_estimado === "number") sumEstimado += a.valor_estimado;
    if (typeof a.valor_aprobado === "number") sumAprobado += a.valor_aprobado ?? 0;
  }
  return {
    total: articulos.length,
    aprobados,
    rechazados,
    pendientes,
    sumEstimado,
    sumAprobado,
  };
}

/* ==================== Subcomponentes ==================== */
function TimelineEstado({ estado }: { estado?: string | null }) {
  const e = norm(estado);
  const pasos = [
    { key: "enviada", label: "Enviada" },
    { key: "revision", label: "En revisión" },
    {
      key: "resuelta",
      label: e.startsWith("aproba")
        ? "Aprobada"
        : e.startsWith("rechaza")
        ? "Rechazada"
        : "Resuelta",
    },
  ] as const;

  const idxActual =
    e.startsWith("aproba") || e.startsWith("rechaza")
      ? 2
      : e.includes("pend") || e.includes("revisi")
      ? 1
      : 0;

  return (
    <div className="flex items-center gap-4 overflow-x-auto">
      {pasos.map((p, i) => {
        const activo = i <= idxActual;
        const final = i === 2 && (e.startsWith("aproba") || e.startsWith("rechaza"));
        return (
          <div key={p.key} className="flex items-center gap-2">
            <div
              className={`grid size-6 place-items-center rounded-full text-[10px] ${
                final
                  ? e.startsWith("aproba")
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                    : "bg-red-500/20 border border-red-500/40 text-red-300"
                  : activo
                  ? "bg-white/10 border border-white/20 text-white"
                  : "bg-black/40 border border-white/10 text-neutral-500"
              }`}
              title={p.label}
            >
              {i + 1}
            </div>
            <div
              className={`text-xs ${
                final
                  ? e.startsWith("aproba")
                    ? "text-emerald-300"
                    : "text-red-300"
                  : activo
                  ? "text-white"
                  : "text-neutral-500"
              }`}
            >
              {p.label}
            </div>
            {i < pasos.length - 1 && <div className="h-px w-10 min-w-10 bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}

function SkeletonLine({ w = "w-full" }: { w?: string }) {
  return <div className={`h-4 animate-pulse rounded bg-white/10 ${w}`} />;
}

/* ==================== Página ==================== */
export default function SolicitudDetalleUsuarioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<SolicitudDetalle | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!Number.isFinite(id)) {
        setError("ID inválido");
        setData(null);
        return;
      }

      // Swagger: GET /solicitudes-completa/{id_solicitud}
      const r = await api.get<SolicitudDetalle>(`/solicitudes-completa/${id}`);
      setData(r.data);
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

  /* ====== Carga / Error ====== */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SkeletonLine w="w-24" />
          <SkeletonLine w="w-20" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:col-span-2 space-y-2">
            <SkeletonLine />
            <SkeletonLine w="w-2/3" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
            <SkeletonLine />
            <SkeletonLine w="w-1/2" />
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
        </div>
      </div>
    );
  }

  if (error || !data) {
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

  const { articulos } = data;
  const resumen = buildResumen(articulos || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/solicitudes")}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <ArrowLeft className="size-4" />
            Volver
          </button>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Solicitud #{data.id_solicitud}</h1>
          <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${badgeByEstado(data.estado)}`}>
            {data.estado ?? "pendiente"}
          </span>
        </div>
        <div className="text-xs text-neutral-400">
          Enviada: {fmtDate(data.fecha_envio)} · Método: {data.metodo_entrega ?? "—"}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <TimelineEstado estado={data.estado} />
      </div>

      {/* Bloque principal: Datos + Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Datos de envío */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-neutral-300">Datos de envío</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-neutral-400">Fecha de envío</div>
              <div className="text-sm font-medium">{fmtDate(data.fecha_envio)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Método</div>
              <div className="text-sm">{data.metodo_entrega ?? "—"}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-neutral-400">Dirección</div>
              <div className="text-sm">{data.direccion_entrega ?? "—"}</div>
            </div>
          </div>
        </div>

        {/* Resumen */}
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
          <div className="mt-3 space-y-1 text-xs text-neutral-400">
            <div className="flex items-center justify-between">
              <span>Valor estimado total</span>
              <span className="font-mono">{fmtMoney(resumen.sumEstimado)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Valor aprobado total</span>
              <span className="font-mono text-emerald-300">{fmtMoney(resumen.sumAprobado)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Artículos */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Package className="size-4 text-blue-300" />
          <h2 className="font-semibold">Artículos</h2>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-neutral-300">
            {articulos.length}
          </span>
        </div>

        {articulos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
            <Package className="mx-auto size-12 text-neutral-600" />
            <p className="mt-3 text-sm text-neutral-400">
              Esta solicitud no tiene artículos registrados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {articulos.map((a) => (
              <div key={a.id_articulo} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
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
                      Valor estimado: <span className="font-mono">{fmtMoney(a.valor_estimado)}</span>
                      {a.valor_aprobado != null && (
                        <>
                          {" "}
                          · Valor aprobado:{" "}
                          <span className="font-mono text-emerald-300">
                            {fmtMoney(a.valor_aprobado)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${badgeByEstado(
                      a.estado,
                    )}`}
                  >
                    {iconByEstado(a.estado)}
                    {a.estado ?? "pendiente"}
                  </span>
                </div>

                {/* Fotos */}
                {a.fotos && a.fotos.length > 0 ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-300">
                      Ver fotos ({a.fotos.length}) <ChevronDown className="ml-1 inline size-3" />
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {a.fotos.map((f) => (
                        <div key={f.id_foto} className="overflow-hidden rounded-lg border border-white/10">
                          <Image
                            src={f.url}
                            alt={`Foto ${f.id_foto}`}
                            width={200}
                            height={150}
                            className="h-[150px] w-full object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </details>
                ) : (
                  <div className="mt-3 text-xs text-neutral-500">Sin fotos</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== Util ==================== */
function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message;
  }
  return "Error desconocido";
}
