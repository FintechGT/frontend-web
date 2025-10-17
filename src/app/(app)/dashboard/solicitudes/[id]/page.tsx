"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { ArrowLeft, Loader2, AlertCircle, Package, Clock, CheckCircle2, XCircle, ChevronDown } from "lucide-react";

/* ===== Tipos ===== */
type Foto = {
  id_foto: number;
  url: string;
};

type Articulo = {
  id_articulo: number;
  descripcion: string;
  tipo_nombre?: string;
  condicion?: string;
  estado: string;
  valor_estimado?: number;
  valor_aprobado?: number | null;
  fotos?: Foto[];
};

type SolicitudDetalle = {
  id_solicitud: number;
  estado: string;
  fecha_envio?: string | null;
  metodo_entrega?: string | null;
  articulos: Articulo[];
};

/* ===== Helpers ===== */
function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "Error desconocido";
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

/* ===== Página ===== */
export default function SolicitudDetallePage() {
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

      const r = await api.get<SolicitudDetalle>(`/solicitudes/${id}`);
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

  if (loading) {
    return (
      <div className="grid place-items-center py-16 text-neutral-400">
        <Loader2 className="mr-2 size-6 animate-spin" />
        Cargando…
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
          <h1 className="text-xl font-semibold">Solicitud #{data.id_solicitud}</h1>
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs capitalize text-neutral-300">
            {data.estado}
          </span>
        </div>

        <div className="text-xs text-neutral-400">
          Enviada: {fmtDate(data.fecha_envio)} · Método: {data.metodo_entrega ?? "—"}
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

        <div className="space-y-3">
          {articulos.map((a) => (
            <div key={a.id_articulo} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">
                      #{a.id_articulo}
                    </span>
                    <span className="text-sm font-medium capitalize">
                      {a.tipo_nombre ?? "Artículo"}
                    </span>
                    <span className="text-xs capitalize text-neutral-400">· {a.condicion}</span>
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
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${
                    a.estado === "aprobado"
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : a.estado === "rechazado"
                      ? "border border-red-500/30 bg-red-500/10 text-red-300"
                      : "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                  }`}
                >
                  {a.estado === "aprobado" ? (
                    <CheckCircle2 className="size-3" />
                  ) : a.estado === "rechazado" ? (
                    <XCircle className="size-3" />
                  ) : (
                    <Clock className="size-3" />
                  )}
                  {a.estado}
                </span>
              </div>

              {/* Fotos */}
              {a.fotos?.length ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-neutral-400">
                    Ver fotos <ChevronDown className="ml-1 inline size-3" />
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.fotos.map((f) => (
                      <div key={f.id_foto} className="overflow-hidden rounded-lg border border-white/10">
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
          ))}
        </div>
      </div>
    </div>
  );
}
