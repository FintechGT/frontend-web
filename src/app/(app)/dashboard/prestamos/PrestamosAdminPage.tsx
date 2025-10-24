// src/app/(app)/dashboard/prestamos/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RefreshCw, SlidersHorizontal } from "lucide-react";
import api from "@/lib/api";

type PrestamoItem = {
  id_prestamo: number;
  id_articulo: number;
  estado: { id: number; nombre: string } | string | null; // acepta objeto o string
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  monto_prestamo: string | number;
  deuda_actual: string | number;
  mora_acumulada: string | number;
  interes_acumulada: string | number;
  ultimo_calculo_en: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type PrestamoResp = {
  items: PrestamoItem[];
  total: number;
  limit: number;
  offset: number;
};

const estadoNombre = (e: PrestamoItem["estado"]) =>
  typeof e === "string" ? e : e?.nombre ?? "—";

const badgeEstado = (nombre?: string | null) => {
  const n = (nombre ?? "").toLowerCase();
  if (n.includes("aprobado") || n === "activo")
    return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (n.includes("mora") || ["incumplido", "incobrable"].includes(n))
    return "border border-red-500/30 bg-red-500/10 text-red-300";
  if (["liquidado", "cerrado", "cancelado"].includes(n))
    return "border border-neutral-500/30 bg-neutral-500/10 text-neutral-300";
  return "border border-blue-500/30 bg-blue-500/10 text-blue-300";
};

export default function PrestamosAdminPage(): React.ReactElement {
  const router = useRouter();
  const sp = useSearchParams();

  const [estado, setEstado] = React.useState(sp.get("estado") ?? "");
  const [sort, setSort] = React.useState<"asc" | "desc">(
    sp.get("sort") === "asc" ? "asc" : "desc",
  );
  const [limit, setLimit] = React.useState<number>(
    Number(sp.get("limit") ?? 20) || 20,
  );
  const [offset, setOffset] = React.useState<number>(
    Number(sp.get("offset") ?? 0) || 0,
  );

  const [data, setData] = React.useState<PrestamoResp | null>(null);
  const [loading, setLoading] = React.useState(true);
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
      const params = new URLSearchParams(query).toString();
      const { data } = await api.get<PrestamoResp>(`/prestamos?${params}`);
      setData(data);
      router.replace(`/dashboard/prestamos?${params}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al cargar préstamos.");
    } finally {
      setLoading(false);
    }
  }, [query, router]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const total = data?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            Inicio
          </Link>
          <h1 className="text-xl font-semibold">Préstamos</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <RefreshCw className="size-4" /> Actualizar
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {err}
        </div>
      )}

      {/* Filtros simples */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-neutral-300">
          <SlidersHorizontal className="size-4" /> Filtros
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Estado</span>
            <input
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              placeholder="activo, en_mora_parcial…"
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Orden</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value === "asc" ? "asc" : "desc")}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setOffset(0);
                void fetchData();
              }}
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-neutral-400">
          <div className="col-span-2">Préstamo</div>
          <div className="col-span-2">Artículo</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2">Fechas</div>
          <div className="col-span-2">Monto / Deuda</div>
          <div className="col-span-2">Int / Mora</div>
        </div>

        {loading ? (
          <div className="grid place-items-center p-10 text-neutral-400">
            <Loader2 className="mr-2 size-6 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {(data?.items ?? []).map((p) => {
              const name = estadoNombre(p.estado);
              return (
                <div
                  key={p.id_prestamo}
                  className="grid grid-cols-12 items-center px-4 py-3 text-sm"
                >
                  <div className="col-span-2 font-medium">
                    <Link
                      href={`/dashboard/prestamos/${p.id_prestamo}`}
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      #{p.id_prestamo}
                    </Link>
                  </div>
                  <div className="col-span-2">#{p.id_articulo}</div>
                  <div className="col-span-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs capitalize ${badgeEstado(
                        name,
                      )}`}
                    >
                      {name}
                    </span>
                  </div>
                  <div className="col-span-2 text-xs font-mono">
                    <div>Ini: {p.fecha_inicio ?? "—"}</div>
                    <div>Vto: {p.fecha_vencimiento ?? "—"}</div>
                  </div>
                  <div className="col-span-2">
                    <div>Q {Number(p.monto_prestamo ?? 0).toLocaleString()}</div>
                    <div className="text-xs text-neutral-400">
                      Deuda: Q {Number(p.deuda_actual ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-2 text-xs">
                    <div>Int: Q {Number(p.interes_acumulada ?? 0).toLocaleString()}</div>
                    <div>Mor: Q {Number(p.mora_acumulada ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
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
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            disabled={!canNext}
            onClick={() => setOffset(offset + limit)}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
