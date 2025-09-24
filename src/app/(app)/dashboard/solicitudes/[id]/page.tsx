// src/app/(app)/dashboard/solicitudes/[id]/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { type Solicitud } from "@/app/services/solicitudes";
import { ArrowLeft } from "lucide-react";

function formatMoney(n: number | undefined): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 2,
  });
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
}

export default function SolicitudDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [s, setS] = React.useState<Solicitud | null>(null);

  React.useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("ID inválido");
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<Solicitud>(`/solicitudes-completa/${id}`);
        if (alive) setS(res.data);
      } catch (e) {
        if (alive)
          setError(e instanceof Error ? e.message : "No se pudo cargar");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/solicitudes")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
        <h1 className="text-xl font-semibold">
          Solicitud {Number.isFinite(id) ? `#${id}` : ""}
        </h1>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
          Cargando…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          {error}
        </div>
      ) : !s ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
          No se encontró la solicitud.
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-neutral-400">Código</dt>
                <dd className="mt-0.5">{s.codigo ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Estado</dt>
                <dd className="mt-0.5 capitalize">{s.estado}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Método entrega</dt>
                <dd className="mt-0.5">{s.metodo_entrega ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Dirección</dt>
                <dd className="mt-0.5 break-words">
                  {s.direccion_entrega ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-400">Fecha envío</dt>
                <dd className="mt-0.5">{formatDate(s.fecha_envio)}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Vence</dt>
                <dd className="mt-0.5">{formatDate(s.fecha_vencimiento)}</dd>
              </div>
            </dl>
          </div>

          {/* Artículos */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Artículos</h2>
            {s.articulos?.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {s.articulos.map((a) => (
                  <li
                    key={a.id_articulo}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{a.descripcion}</div>
                      <div className="text-sm text-neutral-400">
                        {a.condicion}
                      </div>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-neutral-400">Tipo</dt>
                        <dd className="mt-0.5">#{a.id_tipo}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-400">Valor estimado</dt>
                        <dd className="mt-0.5">
                          {formatMoney(a.valor_estimado)}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-neutral-400">Fotos</dt>
                        <dd className="mt-0.5">
                          {a.fotos?.length
                            ? `${a.fotos.length} foto(s)`
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                Esta solicitud no tiene artículos.
              </div>
            )}
          </section>

          {/* CTA opcional */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/solicitudes"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
            >
              Ver todas
            </Link>
            
          </div>
        </>
      )}
    </div>
  );
}
