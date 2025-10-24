"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { listarMisPagos, type MisPagosResponse, type PagoItem } from "@/app/services/pagos";

export default function MisPagosPage(): React.ReactElement {
  const router = useRouter();
  const sp = useSearchParams();

  const [limit, setLimit] = React.useState<number>(Number(sp.get("limit") ?? 20) || 20);
  const [offset, setOffset] = React.useState<number>(Number(sp.get("offset") ?? 0) || 0);
  const [idPrestamo, setIdPrestamo] = React.useState<string>(sp.get("id_prestamo") ?? "");

  const query = React.useMemo(() => {
    const q: Record<string, string> = { limit: String(limit), offset: String(offset) };
    if (idPrestamo.trim()) q.id_prestamo = idPrestamo.trim();
    return q;
  }, [limit, offset, idPrestamo]);

  const [data, setData] = React.useState<MisPagosResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await listarMisPagos(query);
      setData(resp);
      router.replace(`/dashboard/mis-pagos?${new URLSearchParams(query).toString()}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al cargar pagos.");
    } finally {
      setLoading(false);
    }
  }, [query, router]);

  React.useEffect(() => { void fetchData(); }, [fetchData]);

  const total = data?.total ?? 0;
  const count = data?.items.length ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mis pagos</h1>
        <button onClick={() => void fetchData()} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
          <RotateCw className="mr-2 inline size-4" /> Actualizar
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            placeholder="Filtrar por Préstamo #"
            className="w-48 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm"
            value={idPrestamo}
            onChange={(e) => setIdPrestamo(e.target.value)}
          />
          <select className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm"
                  value={limit} onChange={(e)=>{setOffset(0); setLimit(Number(e.target.value))}}>
            {[10,20,30,50].map(n => <option key={n} value={n}>{n} / página</option>)}
          </select>
          <button onClick={()=>{setOffset(0); void fetchData();}}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
            Aplicar
          </button>
          <button onClick={()=>{setIdPrestamo(""); setOffset(0);}}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
            Limpiar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-neutral-400">
          <div className="col-span-3">Pago</div>
          <div className="col-span-3">Préstamo</div>
          <div className="col-span-3">Fecha</div>
          <div className="col-span-3">Monto</div>
        </div>

        {loading ? (
          <div className="grid place-items-center p-10 text-neutral-400">
            <RotateCw className="mr-2 size-6 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {(data?.items ?? []).map((p: PagoItem) => (
              <div key={p.id_pago} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-3">
                  <div className="font-mono">#{p.id_pago}</div>
                  <div className="text-xs text-neutral-400 capitalize">{p.estado}</div>
                </div>
                <div className="col-span-3">
                  <Link href={`/dashboard/prestamos/${p.id_prestamo}`} className="text-blue-400 underline">#{p.id_prestamo}</Link>
                  <div className="text-xs text-neutral-400 capitalize">{p.medio_pago ?? "—"} {p.tipo_pago ? `· ${p.tipo_pago}` : ""}</div>
                </div>
                <div className="col-span-3">{p.fecha_pago ?? "—"}</div>
                <div className="col-span-3">Q {Number(p.monto ?? 0).toLocaleString()}</div>
              </div>
            ))}
            {count === 0 && <div className="p-6 text-center text-neutral-400">Sin resultados.</div>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">Total: {total} · Mostrando {count}</div>
        <div className="flex items-center gap-2">
          <button disabled={!canPrev} onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
            <ChevronLeft className="size-4" /> Anterior
          </button>
          <button disabled={!canNext} onClick={() => setOffset(offset + limit)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
            Siguiente <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
