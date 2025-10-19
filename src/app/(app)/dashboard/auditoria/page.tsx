// src/app/(app)/dashboard/auditoria/page.tsx
"use client";

import * as React from "react";
import api from "@/lib/api";
import { Search, RotateCw, Filter, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

/** ===== Tipos según Swagger ===== */
type UsuarioMini = { id: number; nombre: string | null };

type AuditItem = {
  id_auditoria: number;
  usuario: UsuarioMini | null;
  modulo: string;
  accion: string;
  fecha_hora: string; // ISO
  detalle: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
};

type AuditListResp =
  | {
      items?: AuditItem[];
      total?: number;
      limit?: number;
      offset?: number;
      sort?: string;
    }
  | AuditItem[];

/** ===== Helpers ===== */
function asArray<T>(data: AuditListResp): T[] {
  if (Array.isArray(data)) return data as T[];
  return Array.isArray(data.items) ? (data.items as T[]) : [];
}

function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message as string;
  }
  return "Error desconocido";
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function JsonPreview({ value }: { value: any }) {
  if (value == null) return <span className="text-neutral-500">—</span>;
  return (
    <pre className="max-h-52 overflow-auto rounded-lg bg-black/30 p-3 text-xs leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

/** ===== API ===== */
async function fetchAuditoria(params: {
  q?: string;
  modulo?: string;
  accion?: string;
  usuario_id?: number | "";
  fecha_desde?: string; // YYYY-MM-DD
  fecha_hasta?: string; // YYYY-MM-DD
  limit: number;
  offset: number;
}): Promise<{ items: AuditItem[]; total: number }> {
  const { data } = await api.get<AuditListResp>("/auditoria", {
    params: {
      q: params.q || undefined,
      modulo: params.modulo || undefined,
      accion: params.accion || undefined,
      usuario_id: params.usuario_id || undefined,
      fecha_desde: params.fecha_desde || undefined,
      fecha_hasta: params.fecha_hasta || undefined,
      limit: params.limit,
      offset: params.offset,
      sort: "-fecha_hora",
    },
  });
  const items = asArray<AuditItem>(data);
  const total =
    Array.isArray(data) ? items.length : typeof data.total === "number" ? data.total : items.length;
  return { items, total };
}

/** ===== Página ===== */
export default function AuditoriaPage() {
  const [items, setItems] = React.useState<AuditItem[]>([]);
  const [total, setTotal] = React.useState(0);

  // filtros
  const [q, setQ] = React.useState("");
  const [modulo, setModulo] = React.useState("");
  const [accion, setAccion] = React.useState("");
  const [usuarioId, setUsuarioId] = React.useState<string>("");
  const [desde, setDesde] = React.useState<string>("");
  const [hasta, setHasta] = React.useState<string>("");

  // paginación
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);

  // estados
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { items, total } = await fetchAuditoria({
        q,
        modulo,
        accion,
        usuario_id: usuarioId ? Number(usuarioId) : "",
        fecha_desde: desde || undefined,
        fecha_hasta: hasta || undefined,
        limit,
        offset,
      });
      setItems(items);
      setTotal(total);
    } catch (e) {
      setError(getErrMsg(e));
    } finally {
      setLoading(false);
    }
  }, [q, modulo, accion, usuarioId, desde, hasta, limit, offset]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function resetAndSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setOffset(0);
    void load();
  }

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Auditoría</h1>
        <button
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          title="Refrescar"
        >
          <RotateCw className="size-4" />
          Refrescar
        </button>
      </div>

      {/* Filtros */}
      <form onSubmit={resetAndSearch} className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-6">
        <div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-900 px-3">
          <Search className="size-4 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (detalle, módulo, acción)…"
            className="h-9 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <input
          value={modulo}
          onChange={(e) => setModulo(e.target.value)}
          placeholder="Módulo (ej: Admin_Solicitudes)"
          className="h-9 rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm outline-none focus:border-blue-500"
        />

        <input
          value={accion}
          onChange={(e) => setAccion(e.target.value)}
          placeholder="Acción (ej: APROBAR_ARTICULO)"
          className="h-9 rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm outline-none focus:border-blue-500"
        />

        <input
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value)}
          placeholder="Usuario ID"
          inputMode="numeric"
          className="h-9 rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm outline-none focus:border-blue-500"
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setQ("");
              setModulo("");
              setAccion("");
              setUsuarioId("");
              setDesde("");
              setHasta("");
              setOffset(0);
              void load();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            <Filter className="size-4" />
            Limpiar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Estados */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-10 text-neutral-400">
          Cargando auditoría…
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          <AlertCircle className="size-5" />
          {error}
        </div>
      )}

      {/* Tabla / Lista */}
      {!loading && !error && (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-12 bg-black/30 px-3 py-2 text-xs font-medium text-neutral-300">
              <div className="col-span-2">Fecha/Hora</div>
              <div className="col-span-2">Usuario</div>
              <div className="col-span-2">Módulo</div>
              <div className="col-span-2">Acción</div>
              <div className="col-span-4">Detalle</div>
            </div>

            {items.map((it, idx) => (
              <details
                key={it.id_auditoria}
                className={`group grid grid-cols-12 gap-3 px-3 py-3 text-sm ${idx % 2 ? "bg-black/20" : "bg-transparent"}`}
              >
                <summary className="col-span-12 grid cursor-pointer grid-cols-12 items-start gap-3 list-none [&::-webkit-details-marker]:hidden">
                  <div className="col-span-2">{fmtDate(it.fecha_hora)}</div>
                  <div className="col-span-2">
                    {it.usuario?.id ?? "—"}{" "}
                    <span className="text-xs text-neutral-400">{it.usuario?.nombre ?? ""}</span>
                  </div>
                  <div className="col-span-2 font-mono">{it.modulo}</div>
                  <div className="col-span-2 font-mono">{it.accion}</div>
                  <div className="col-span-4 truncate text-neutral-300">{it.detalle ?? "—"}</div>
                </summary>

                {/* Panel expandible */}
                <div className="col-span-12 grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-neutral-300">Valores anteriores</div>
                    <JsonPreview value={it.old_values} />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-neutral-300">Valores nuevos</div>
                    <JsonPreview value={it.new_values} />
                  </div>
                </div>
              </details>
            ))}

            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-neutral-400">Sin resultados</div>
            )}
          </div>

          {/* Paginación */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-neutral-400">
              {total > 0 ? (
                <>
                  Mostrando <span className="text-neutral-200">{offset + 1}</span>–
                  <span className="text-neutral-200">{Math.min(offset + limit, total)}</span> de{" "}
                  <span className="text-neutral-200">{total}</span>
                </>
              ) : (
                "Sin resultados"
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-lg border border-white/10 bg-neutral-900 px-2 text-sm outline-none"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} por página
                  </option>
                ))}
              </select>

              <button
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset <= 0}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-sm hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </button>
              <div className="w-24 text-center text-sm text-neutral-300">
                {page} / {pages}
              </div>
              <button
                onClick={() => setOffset((o) => (o + limit < total ? o + limit : o))}
                disabled={offset + limit >= total}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-sm hover:bg-white/5 disabled:opacity-40"
              >
                Siguiente
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
