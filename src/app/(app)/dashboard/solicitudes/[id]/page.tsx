"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSolicitudCompleta, type Solicitud } from "@/app/services/solicitudes";

export default function SolicitudDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [data, setData] = React.useState<Solicitud | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const s = await getSolicitudCompleta(id);
        if (alive) setData(s);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "No se pudo cargar");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitud #{id}</h1>
        <Link href="/dashboard/solicitudes" className="text-sm text-blue-400 hover:underline">
          ← Volver
        </Link>
      </div>

      {loading && <div className="text-neutral-400">Cargando…</div>}
      {error && !loading && <div className="text-red-400">{error}</div>}
      {!loading && !error && data && (
        <div className="grid gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <div><dt className="text-neutral-400">Código</dt><dd className="mt-1">{data.codigo ?? "—"}</dd></div>
              <div><dt className="text-neutral-400">Estado</dt><dd className="mt-1">{data.estado ?? "—"}</dd></div>
              <div><dt className="text-neutral-400">Método de entrega</dt><dd className="mt-1">{data.metodo_entrega ?? "—"}</dd></div>
              <div><dt className="text-neutral-400">Dirección</dt><dd className="mt-1">{data.direccion_entrega ?? "—"}</dd></div>
              <div><dt className="text-neutral-400">Fecha</dt><dd className="mt-1">{(data.created_at || data.fecha_envio || "—").slice(0,10)}</dd></div>
              <div><dt className="text-neutral-400">Vencimiento</dt><dd className="mt-1">{(data.fecha_vencimiento || "—").slice(0,10)}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5">
            <header className="px-4 py-3">
              <h2 className="text-base font-semibold">Artículos ({data.articulos?.length ?? 0})</h2>
            </header>
            <div className="divide-y divide-white/10 text-sm">
              {(data.articulos ?? []).map((a) => (
                <div key={a.id_articulo} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_120px_140px]">
                  <div>
                    <div className="font-medium">{a.descripcion}</div>
                    <div className="text-neutral-400">Condición: {a.condicion ?? "—"}</div>
                    {!!a.fotos?.length && (
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {a.fotos.map((f) => (
                          <img key={f.id_foto ?? f.url} src={f.url} alt="" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="sm:text-right">Tipo #{a.id_tipo}</div>
                  <div className="sm:text-right">Q {a.valor_estimado?.toLocaleString?.() ?? a.valor_estimado}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
