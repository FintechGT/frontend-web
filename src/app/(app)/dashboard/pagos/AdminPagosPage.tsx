// src/app/(app)/dashboard/pagos/AdminPagosPage.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RotateCw,
  CheckCircle2,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  listarPagos,
  validarPago,
  type PagosListResponse,
  type PagoItem,
} from "@/app/services/pagos";
import { useAuth } from "@/app/AppLayoutClient";
import { usePermiso } from "@/hooks/usePermiso";

export default function AdminPagosPage(): React.ReactElement {
  const router = useRouter();
  const sp = useSearchParams();

  // gates
  const { roles = [] } = useAuth() ?? { roles: [] as string[] };
  const tienePermiso = usePermiso(["pagos.view", "pagos.listar_todos", "admin.pagos"]);
  const esRolAdmin = roles.some((r) =>
    ["ADMINISTRADOR", "SUPERVISOR", "CAJERO"].includes(r.toUpperCase()),
  );
  const puedeVer = tienePermiso || esRolAdmin;

  // filtros url-state
  const [estado, setEstado] = React.useState(sp.get("estado") ?? "");
  const [medio, setMedio] = React.useState(sp.get("medio") ?? "");
  const [tipo, setTipo] = React.useState(sp.get("tipo") ?? "");
  const [refc, setRefc] = React.useState(sp.get("ref") ?? "");
  const [desde, setDesde] = React.useState(sp.get("desde") ?? "");
  const [hasta, setHasta] = React.useState(sp.get("hasta") ?? "");
  const [sort, setSort] = React.useState<"asc" | "desc">(
    sp.get("sort") === "asc" ? "asc" : "desc",
  );
  const [limit, setLimit] = React.useState<number>(
    Number(sp.get("limit") ?? 20) || 20,
  );
  const [offset, setOffset] = React.useState<number>(
    Number(sp.get("offset") ?? 0) || 0,
  );

  const query = React.useMemo(() => {
    const q: Record<string, string> = {
      limit: String(limit),
      offset: String(offset),
      sort,
    };
    if (estado) q.estado = estado;
    if (medio) q.medio_pago = medio;
    if (tipo) q.tipo_pago = tipo;
    if (refc) q.ref_contains = refc;
    if (desde) q.fecha_desde = desde;
    if (hasta) q.fecha_hasta = hasta;
    return q;
  }, [estado, medio, tipo, refc, desde, hasta, sort, limit, offset]);

  const [data, setData] = React.useState<PagosListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!puedeVer) return;
    setLoading(true);
    setErr(null);
    try {
      const resp = await listarPagos(query);
      setData(resp);
      router.replace(`/dashboard/pagos?${new URLSearchParams(query).toString()}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al listar pagos.");
    } finally {
      setLoading(false);
    }
  }, [puedeVer, query, router]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (!puedeVer) {
    return (
      <div className="rounded-2xl border border-white/10 bg-red-500/10 p-4 text-sm text-red-200">
        No tienes permisos para ver el listado global de pagos.
      </div>
    );
  }

  const total = data?.total ?? 0;
  const count = data?.items.length ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  async function onValidar(p: PagoItem) {
    if (!confirm(`¿Validar el pago #${p.id_pago} por Q ${p.monto}?`)) return;
    try {
      await validarPago(p.id_pago, "Validado desde listado");
      await fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "No se pudo validar.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pagos</h1>
        <button
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <RotateCw className="size-4" /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-white/10 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm md:col-span-1"
            placeholder="Estado (pendiente, validado…)"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          />
          <input
            className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm md:col-span-1"
            placeholder="Medio (efectivo, transferencia…)"
            value={medio}
            onChange={(e) => setMedio(e.target.value)}
          />
          <input
            className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm md:col-span-1"
            placeholder="Tipo (abono, total…)"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
          <div className="flex items-center gap-2 md:col-span-3">
            <div className="flex w-full items-center gap-2">
              <Calendar className="size-4 opacity-70" />
              <input
                type="date"
                className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
              <span className="text-sm text-neutral-400">→</span>
              <input
                type="date"
                className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-3 flex items-center gap-2">
            <Search className="size-4 opacity-70" />
            <input
              className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm"
              placeholder="Referencia bancaria contiene…"
              value={refc}
              onChange={(e) => setRefc(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as "asc" | "desc")}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <select
            className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm"
            value={limit}
            onChange={(e) => {
              setOffset(0);
              setLimit(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / página
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setOffset(0);
              void fetchData();
            }}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            Aplicar
          </button>
          <button
            onClick={() => {
              setEstado("");
              setMedio("");
              setTipo("");
              setRefc("");
              setDesde("");
              setHasta("");
              setOffset(0);
            }}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Error */}
      {err && !loading && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5" />
            {err}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-neutral-400">
          <div className="col-span-2">Pago</div>
          <div className="col-span-2">Préstamo</div>
          <div className="col-span-2">Cliente</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2">Fecha</div>
          <div className="col-span-2">Monto</div>
        </div>

        {loading ? (
          <div className="grid place-items-center p-10 text-neutral-400">
            <RotateCw className="mr-2 size-6 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {(data?.items ?? []).map((p: PagoItem) => (
              <div key={p.id_pago} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-2">
                  <div className="font-mono">#{p.id_pago}</div>
                  {p.ref_bancaria && (
                    <div className="text-xs text-neutral-400">Ref: {p.ref_bancaria}</div>
                  )}
                </div>
                <div className="col-span-2">
                  <Link
                    href={`/dashboard/prestamos/${p.id_prestamo}`}
                    className="text-blue-400 underline"
                  >
                    #{p.id_prestamo}
                  </Link>
                  <div className="text-xs text-neutral-400">{p.prestamo?.estado ?? "—"}</div>
                </div>
                <div className="col-span-2">
                  {p.cliente ? (
                    <>
                      <div>{p.cliente.nombre}</div>
                      <div className="text-xs text-neutral-400">{p.cliente.correo}</div>
                    </>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </div>
                <div className="col-span-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs capitalize ${
                      p.estado === "pendiente"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : p.estado === "validado"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-white/20 bg-white/10 text-neutral-300"
                    }`}
                  >
                    {p.estado}
                  </span>
                  <div className="text-xs text-neutral-400 capitalize">
                    {p.medio_pago ?? "—"} {p.tipo_pago ? `· ${p.tipo_pago}` : ""}
                  </div>
                </div>
                <div className="col-span-2">{p.fecha_pago ?? "—"}</div>
                <div className="col-span-2 flex items-center justify-between gap-2">
                  <div>Q {Number(p.monto ?? 0).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/prestamos/${p.id_prestamo}?tab=pagos`}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                    >
                      Ver
                    </Link>
                    {p.estado === "pendiente" && (
                      <button
                        onClick={() => void onValidar(p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 className="size-3" /> Validar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {count === 0 && (
              <div className="p-6 text-center text-neutral-400">Sin resultados.</div>
            )}
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">Total: {total} · Mostrando {count}</div>
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
