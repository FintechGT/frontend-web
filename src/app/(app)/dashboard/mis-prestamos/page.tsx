"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
  listarMisPrestamos,
  type MisPrestamosResp,
  type MiPrestamoItem,
} from "@/app/services/prestamos";

export default function MisPrestamosPage(): React.ReactElement {
  const router = useRouter();
  const sp = useSearchParams();

  // Filtros / query
  const [estado, setEstado] = React.useState<string>(sp.get("estado") ?? "");
  const [sort, setSort] = React.useState<"asc" | "desc">(
    sp.get("sort") === "asc" ? "asc" : "desc"
  );
  const [limit, setLimit] = React.useState<number>(Number(sp.get("limit") ?? 20) || 20);
  const [offset, setOffset] = React.useState<number>(Number(sp.get("offset") ?? 0) || 0);

  // Datos
  const [data, setData] = React.useState<MisPrestamosResp | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [err, setErr] = React.useState<string | null>(null);

  const query = React.useMemo(() => {
    const q: Record<string, string> = {
      limit: String(limit),
      offset: String(offset),
      sort,
    };
    if (estado.trim()) q.estado = estado.trim();
    return q;
  }, [estado, limit, offset, sort]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await listarMisPrestamos({
        limit,
        offset,
        estado: estado.trim() || undefined,
        sort,
      } as any);
      setData(res);
      router.replace(`/dashboard/mis-prestamos?${new URLSearchParams(query).toString()}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al cargar préstamos.");
    } finally {
      setLoading(false);
    }
  }, [router, limit, offset, estado, sort, query]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const total = data?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mis préstamos</h1>
        <button
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <RefreshCw className="size-4" /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <label className="grid gap-1 text-sm sm:col-span-3">
            <span className="text-neutral-300">Estado (ej: activo, en_mora_parcial)</span>
            <input
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="activo, en_mora_parcial…"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Orden</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "asc" | "desc")}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Límite</span>
            <input
              type="number"
              min={1}
              max={200}
              value={limit}
              onChange={(e) => setLimit(Math.min(200, Math.max(1, Number(e.target.value) || 1)))}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>

          <div className="flex items-end gap-2 sm:col-span-3">
            <button
              onClick={() => {
                setOffset(0);
                void fetchData();
              }}
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500"
            >
              Aplicar
            </button>
            <button
              onClick={() => {
                setEstado("");
                setSort("desc");
                setLimit(20);
                setOffset(0);
                void fetchData();
              }}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-neutral-400">
          <div className="col-span-3">Préstamo</div>
          <div className="col-span-3">Estado</div>
          <div className="col-span-3">Fechas</div>
          <div className="col-span-3">Deuda</div>
        </div>

        {loading ? (
          <div className="grid place-items-center p-10 text-neutral-400">
            <Loader2 className="mr-2 size-6 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {(data?.items ?? []).map((p: MiPrestamoItem) => (
              <div key={p.id_prestamo} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-3">
                  <Link
                    href={`/dashboard/prestamos/${p.id_prestamo}`}
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    #{p.id_prestamo}
                  </Link>
                  <div className="text-xs text-neutral-400">Artículo #{p.id_articulo}</div>
                </div>
                <div className="col-span-3">
                  <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs capitalize text-blue-300">
              
                  </span>
                </div>
                <div className="col-span-3 text-xs font-mono">
                  <div>Ini: {p.fecha_inicio ?? "—"}</div>
                  <div>Vto: {p.fecha_vencimiento ?? "—"}</div>
                </div>
                <div className="col-span-3">
                  <div>Deuda: Q {Number(p.deuda_actual ?? 0).toLocaleString()}</div>
                  <div className="text-xs text-neutral-400">
                    Int: Q {Number(p.interes_acumulada ?? 0).toLocaleString()} · Mora: Q{" "}
                    {Number(p.mora_acumulada ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {(data?.items.length ?? 0) === 0 && (
              <div className="p-6 text-center text-neutral-400">Sin resultados.</div>
            )}
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">
          Total: {total} · Mostrando {data?.items.length ?? 0}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!canPrev}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            <ChevronLeft className="size-4" /> Anterior
          </button>
          <button
            disabled={!canNext}
            onClick={() => setOffset(offset + limit)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            Siguiente <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
