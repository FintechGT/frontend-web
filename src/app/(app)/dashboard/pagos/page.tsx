// src/app/(app)/dashboard/pagos/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, RotateCw, Search, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { useAuth } from "@/app/AppLayoutClient";
import { usePermiso } from "@/hooks/usePermiso";
import { listarPagos, validarPago, type PagoItem, type PagosListResponse } from "@/app/services/pagos";

// Reutiliza la página del cliente para no-admins
import MisPagosPage from "../mis-pagos/page";

export default function PagePagos(): React.ReactElement {
  const { roles, loading } = useAuth();

  const tienePermisoAdmin = usePermiso([
    "pagos.view",
    "pagos.listar_todos",
    "admin.pagos",
  ]);
  const esRolAdmin = roles.some((r) =>
    ["ADMINISTRADOR", "SUPERVISOR", "CAJERO"].includes(r.toUpperCase())
  );
  const esAdmin = tienePermisoAdmin || esRolAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-400">
        <RotateCw className="mr-2 size-6 animate-spin" />
        Verificando permisos…
      </div>
    );
  }

  return esAdmin ? <PagosAdminList /> : <MisPagosPage />;
}

/* ---------------------- LISTADO ADMIN ---------------------- */
function PagosAdminList(): React.ReactElement {
  const router = useRouter();
  const sp = useSearchParams();

  // Filtros controlados por URL
  const [estado, setEstado] = React.useState(sp.get("estado") ?? "");
  const [medio, setMedio] = React.useState(sp.get("medio_pago") ?? "");
  const [tipo, setTipo] = React.useState(sp.get("tipo_pago") ?? "");
  const [ref, setRef] = React.useState(sp.get("ref_contains") ?? "");
  const [desde, setDesde] = React.useState(sp.get("fecha_desde") ?? "");
  const [hasta, setHasta] = React.useState(sp.get("fecha_hasta") ?? "");
  const [sort, setSort] = React.useState<"asc" | "desc">(sp.get("sort") === "asc" ? "asc" : "desc");
  const [limit, setLimit] = React.useState<number>(Number(sp.get("limit") ?? 20) || 20);
  const [offset, setOffset] = React.useState<number>(Number(sp.get("offset") ?? 0) || 0);

  const [data, setData] = React.useState<PagosListResponse | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  const query = React.useMemo(() => {
    const q: Record<string, string> = {
      limit: String(limit),
      offset: String(offset),
      sort,
    };
    if (estado) q.estado = estado;
    if (medio) q.medio_pago = medio;
    if (tipo) q.tipo_pago = tipo;
    if (ref) q.ref_contains = ref;
    if (desde) q.fecha_desde = desde;
    if (hasta) q.fecha_hasta = hasta;
    return q;
  }, [estado, medio, tipo, ref, desde, hasta, sort, limit, offset]);

  const fetchData = React.useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await listarPagos(query);
      setData(res);
      router.replace(`/dashboard/pagos?${new URLSearchParams(query).toString()}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al cargar pagos.");
    } finally {
      setBusy(false);
    }
  }, [query, router]);

  React.useEffect(() => { void fetchData(); }, [fetchData]);

  const total = data?.total ?? 0;
  const shown = data?.items.length ?? 0;
  const canPrev = (offset || 0) > 0;
  const canNext = (offset || 0) + (limit || 0) < total;

  async function onValidar(p: PagoItem) {
    if (!confirm(`¿Validar el pago #${p.id_pago} por Q ${p.monto.toLocaleString()}?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await validarPago(p.id_pago, "Validado desde listado");
      await fetchData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo validar el pago.");
    } finally {
      setBusy(false);
    }
  }

  function limpiar() {
    setEstado(""); setMedio(""); setTipo(""); setRef(""); setDesde(""); setHasta("");
    setOffset(0);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="size-5" /> Pagos (global)
        </h1>
        <button
          onClick={() => void fetchData()}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          disabled={busy}
        >
          {busy ? <Loader2 className="mr-2 inline size-4 animate-spin" /> : null}
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            placeholder="estado: pendiente, validado…"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
          />
          <input
            value={medio}
            onChange={(e) => setMedio(e.target.value)}
            placeholder="medio: efectivo, transferencia…"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
          />
          <input
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="tipo: abono, total…"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
          />
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="ref bancaria contiene…"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value === "asc" ? "asc" : "desc")}
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
          >
            <option value="desc">Orden: desc</option>
            <option value="asc">Orden: asc</option>
          </select>
          <select
            value={String(limit)}
            onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
          >
            {[10,20,50,100].map(n => <option key={n} value={n}>Límite: {n}</option>)}
          </select>

          <button
            onClick={() => { setOffset(0); void fetchData(); }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            disabled={busy}
          >
            <Search className="size-4" /> Aplicar
          </button>
          <button
            onClick={limpiar}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            disabled={busy}
          >
            Limpiar
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {err}
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
          <div className="col-span-2 text-right">Monto</div>
        </div>

        {busy ? (
          <div className="grid place-items-center p-10 text-neutral-400">
            <Loader2 className="mr-2 size-6 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {(data?.items ?? []).map((p: PagoItem) => {
              const pendiente = p.estado?.toLowerCase() === "pendiente" || p.id_estado === 1;
              return (
                <div key={p.id_pago} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                  <div className="col-span-2">
                    <div className="font-medium">#{p.id_pago}</div>
                    {p.ref_bancaria ? (
                      <div className="text-xs text-neutral-400">Ref: {p.ref_bancaria}</div>
                    ) : null}
                  </div>

                  <div className="col-span-2">
                    <Link
                      href={`/dashboard/prestamos/${p.id_prestamo}`}
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      Préstamo #{p.id_prestamo}
                    </Link>
                  </div>

                  <div className="col-span-2">
                    {p.cliente ? (
                      <>
                        <div className="truncate">{p.cliente.nombre}</div>
                        <div className="text-xs text-neutral-400 truncate">{p.cliente.correo}</div>
                      </>
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs capitalize ${
                        pendiente
                          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                          : p.estado?.toLowerCase() === "validado" || p.id_estado === 3
                          ? "border-green-500/30 bg-green-500/10 text-green-300"
                          : "border-white/20 bg-white/5 text-neutral-300"
                      }`}
                    >
                      {p.estado ?? "—"}
                    </span>
                  </div>

                  <div className="col-span-2 text-xs font-mono">
                    {p.fecha_pago ?? "—"}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <div className="tabular-nums">Q {Number(p.monto ?? 0).toLocaleString()}</div>
                    {pendiente ? (
                      <button
                        onClick={() => void onValidar(p)}
                        className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-1 text-xs text-green-300 hover:bg-green-500/20"
                      >
                        <CheckCircle2 className="size-4" /> Validar
                      </button>
                    ) : null}
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
          Total: {total} · Mostrando {shown}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!canPrev || busy}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            <ChevronLeft className="size-4" /> Anterior
          </button>
          <button
            disabled={!canNext || busy}
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
