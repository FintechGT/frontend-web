"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import {
  Plus,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

type PrestamoItem = {
  id_prestamo: number;
  id_articulo: number;
  id_usuario_evaluador: number | null;
  estado: { id: number; nombre: string } | null;
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

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export default function PrestamosAdminPage(): React.ReactElement {
  const router = useRouter();
  const sp = useSearchParams();

  const [estado, setEstado] = React.useState(sp.get("estado") ?? "");
  const [usuarioId, setUsuarioId] = React.useState(sp.get("usuario_id") ?? "");
  const [idArticulo, setIdArticulo] = React.useState(sp.get("id_articulo") ?? "");
  const [desde, setDesde] = React.useState(sp.get("fecha_desde") ?? "");
  const [hasta, setHasta] = React.useState(sp.get("fecha_hasta") ?? "");
  const [venceAntes, setVenceAntes] = React.useState(sp.get("vencimiento_antes") ?? "");
  const [sort, setSort] = React.useState<"asc" | "desc">(sp.get("sort") === "asc" ? "asc" : "desc");
  const [limit, setLimit] = React.useState<number>(Number(sp.get("limit") ?? 20) || 20);
  const [offset, setOffset] = React.useState<number>(Number(sp.get("offset") ?? 0) || 0);

  const [data, setData] = React.useState<PrestamoResp | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [creating, setCreating] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [cIdArticulo, setCIdArticulo] = React.useState("");
  const [cMonto, setCMonto] = React.useState("");
  const [cPlazo, setCPlazo] = React.useState("30");

  const hoy = React.useMemo(() => new Date(), []);
  const vto = React.useMemo(() => addDays(hoy, Number(cPlazo || "0")), [hoy, cPlazo]);

  const query = React.useMemo(() => {
    const q: Record<string, string> = { limit: String(limit), offset: String(offset), sort };
    if (estado.trim()) q.estado = estado.trim();
    if (usuarioId.trim()) q.usuario_id = usuarioId.trim();
    if (idArticulo.trim()) q.id_articulo = idArticulo.trim();
    if (desde) q.fecha_desde = desde;
    if (hasta) q.fecha_hasta = hasta;
    if (venceAntes) q.vencimiento_antes = venceAntes;
    return q;
  }, [estado, usuarioId, idArticulo, desde, hasta, venceAntes, limit, offset, sort]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams(query).toString();
      const { data } = await api.get<PrestamoResp>(`/prestamos?${params}`);
      setData(data);
      router.replace(`/dashboard/prestamos?${params}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al cargar préstamos.");
    } finally {
      setLoading(false);
    }
  }, [query, router]);

  React.useEffect(() => { void fetchData(); }, [fetchData]);

  const resetOffsetThenLoad = () => {
    setOffset(0);
    setTimeout(() => void fetchData(), 0);
  };

  const total = data?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  async function onCreatePrestamo(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!cIdArticulo.trim() || !cMonto.trim() || !cPlazo.trim()) {
      setErr("Completa los campos del nuevo préstamo."); return;
    }
    const monto = Number(cMonto);
    const plazo = Number(cPlazo);
    if (!Number.isFinite(monto) || monto <= 0) { setErr("El monto debe ser mayor a 0."); return; }
    if (!Number.isInteger(plazo) || plazo <= 0) { setErr("El plazo en días debe ser entero y mayor a 0."); return; }
    setCreating(true);
    try {
      await api.post("/prestamos", {
        id_articulo: Number(cIdArticulo),
        fecha_inicio: isoDate(hoy),
        fecha_vencimiento: isoDate(vto),
        monto_prestamo: monto,
        plazo_dias: plazo,
      });
      setShowCreate(false);
      setCIdArticulo(""); setCMonto(""); setCPlazo("30");
      await fetchData();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo crear el préstamo.");
    } finally { setCreating(false); }
  }

  function badgeEstado(nombre?: string | null) {
    const n = (nombre ?? "").toLowerCase();
    if (n.includes("aprobado") || n === "activo") return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    if (n.includes("mora") || n === "incumplido" || n === "incobrable") return "border border-red-500/30 bg-red-500/10 text-red-300";
    if (n === "liquidado" || n === "cerrado") return "border border-neutral-500/30 bg-neutral-500/10 text-neutral-300";
    return "border border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">Inicio</Link>
          <h1 className="text-xl font-semibold">Préstamos</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500">
            <Plus className="size-4" /> Crear préstamo
          </button>
          <button onClick={() => void fetchData()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
            <RefreshCw className="size-4" /> Actualizar
          </button>
        </div>
      </div>

      {err && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{err}</div>}

      {/* Filtros */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-neutral-300"><SlidersHorizontal className="size-4" /> Filtros</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Estado</span>
            <input value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="activo, en_mora_parcial…" className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Usuario ID</span>
            <input value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} placeholder="123" className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Artículo ID</span>
            <input value={idArticulo} onChange={(e) => setIdArticulo(e.target.value)} placeholder="101" className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Vence antes de (YYYY-MM-DD)</span>
            <input value={venceAntes} onChange={(e) => setVenceAntes(e.target.value)} placeholder="2025-12-31" className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Fecha desde</span>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Fecha hasta</span>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Orden</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as "asc" | "desc")} className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500">
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-sm">
              <span className="text-neutral-300">Límite</span>
              <input type="number" min={1} max={200} value={limit} onChange={(e) => setLimit(Math.min(200, Math.max(1, Number(e.target.value) || 1)))} className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-neutral-300">Offset</span>
              <input type="number" min={0} value={offset} onChange={(e) => setOffset(Math.max(0, Number(e.target.value) || 0))} className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500" />
            </label>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={resetOffsetThenLoad} className="rounded-xl bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500">Aplicar filtros</button>
          <button
            onClick={() => {
              setEstado(""); setUsuarioId(""); setIdArticulo(""); setDesde(""); setHasta(""); setVenceAntes("");
              setSort("desc"); setLimit(20); setOffset(0); setTimeout(() => void fetchData(), 0);
            }}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            Limpiar
          </button>
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
          <div className="col-span-1">Interés / Mora</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        {loading ? (
          <div className="grid place-items-center p-10 text-neutral-400">
            <Loader2 className="mr-2 size-6 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {(data?.items ?? []).map((p) => (
              <div
                key={p.id_prestamo}
                className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-white/5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/prestamos/${p.id_prestamo}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") router.push(`/dashboard/prestamos/${p.id_prestamo}`);
                }}
              >
                <div className="col-span-2 font-medium">
                  <Link
                    href={`/dashboard/prestamos/${p.id_prestamo}`}
                    className="text-blue-400 underline hover:text-blue-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    #{p.id_prestamo}
                  </Link>
                </div>
                <div className="col-span-2">#{p.id_articulo}</div>
                <div className="col-span-2">
                  <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${badgeEstado(p.estado?.nombre)}`}>
                    {p.estado?.nombre ?? "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <div className="font-mono text-xs">Ini: {p.fecha_inicio ?? "—"}</div>
                  <div className="font-mono text-xs">Vto: {p.fecha_vencimiento ?? "—"}</div>
                </div>
                <div className="col-span-2">
                  <div>Q {Number(p.monto_prestamo ?? 0).toLocaleString()}</div>
                  <div className="text-neutral-400 text-xs">
                    Deuda: Q {Number(p.deuda_actual ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="col-span-1 text-xs">
                  <div>Int: Q {Number(p.interes_acumulada ?? 0).toLocaleString()}</div>
                  <div>Mor: Q {Number(p.mora_acumulada ?? 0).toLocaleString()}</div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Link
                    href={`/dashboard/prestamos/${p.id_prestamo}`}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver
                  </Link>
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
        <div className="text-sm text-neutral-400">Total: {total} · Mostrando {data?.items.length ?? 0}</div>
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

      {/* Modal crear préstamo */}
      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5">
            <div className="mb-3 text-lg font-semibold">Crear préstamo</div>

            <form onSubmit={onCreatePrestamo} className="space-y-3">
              <label className="grid gap-1 text-sm">
                <span className="text-neutral-300">ID Artículo</span>
                <input
                  value={cIdArticulo}
                  onChange={(e) => setCIdArticulo(e.target.value)}
                  placeholder="Ej. 123"
                  className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-neutral-300">Monto del préstamo (Q)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={cMonto}
                  onChange={(e) => setCMonto(e.target.value)}
                  placeholder="1500.00"
                  className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-neutral-300">Plazo (días)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={cPlazo}
                  onChange={(e) => setCPlazo(e.target.value)}
                  className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </label>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-neutral-300">
                <div>Fecha inicio: <span className="font-mono">{isoDate(hoy)}</span></div>
                <div>Fecha vencimiento: <span className="font-mono">{isoDate(vto)}</span></div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5" disabled={creating}>Cancelar</button>
                <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500 disabled:opacity-50">
                  {creating ? <Loader2 className="size-4 animate-spin" /> : null}
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
