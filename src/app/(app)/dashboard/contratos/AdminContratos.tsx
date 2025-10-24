"use client";

import * as React from "react";
import Link from "next/link";
import {
  listarContratos,
  EstadoFirma,
  ContratoListResponse,
  urlVerContrato,
  urlAbrirContrato,
} from "@/app/services/contratos";
import {
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  Download,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";

function human(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "ERR_NETWORK: posible CORS/SSL/servidor caído";
}

export default function AdminContratos() {
  const [q, setQ] = React.useState("");
  const [estado, setEstado] = React.useState<EstadoFirma | "todos">("todos");
  const [limit] = React.useState(50);
  const [offset, setOffset] = React.useState(0);

  const [data, setData] = React.useState<ContratoListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await listarContratos({
        q: q.trim() || undefined,
        estado_firma: estado === "todos" ? undefined : estado,
        limit,
        offset,
      });
      setData(resp);
    } catch (e) {
      setError(human(e));
    } finally {
      setLoading(false);
    }
  }, [q, estado, limit, offset]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const canPrev = offset > 0;
  const canNext = data ? offset + limit < data.total : false;

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEstado(e.target.value as EstadoFirma | "todos");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contratos (Administración)</h1>
        <button
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
        >
          <RefreshCw className="size-4" />
          Refrescar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 size-4 text-neutral-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (id, texto del artículo)…"
            className="rounded-lg border border-white/10 bg-transparent pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-neutral-400" />
          <select
            className="rounded-lg border border-white/10 bg-transparent px-2 py-2 text-sm"
            value={estado}
            onChange={handleEstadoChange}
          >
            <option value="todos">Estado: todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
            <option value="completo">Completo</option>
          </select>
        </div>
        <button
          onClick={() => setOffset(0)}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Aplicar
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-neutral-400">
          <Loader2 className="mr-2 size-6 animate-spin" />
          Cargando datos de contratos…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5" />
            {error}
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-neutral-400">
              No hay contratos con esos filtros.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-neutral-300">
                  <tr className="border-b border-white/10">
                    <th className="p-2 text-left">Contrato</th>
                    <th className="p-2 text-left">Préstamo</th>
                    <th className="p-2 text-left">Artículo</th>
                    <th className="p-2 text-left">Monto</th>
                    <th className="p-2 text-left">Estado firma</th>
                    <th className="p-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((it) => {
                    const firmaCliente = Boolean(it.firma_cliente_en);
                    const firmaEmpresa = Boolean(it.firma_empresa_en);
                    const completo = firmaCliente && firmaEmpresa;
                    const parcial = !completo && (firmaCliente || firmaEmpresa);

                    return (
                      <tr key={it.id_contrato} className="border-t border-white/10 hover:bg-white/5">
                        <td className="p-2 font-mono text-blue-400">#{it.id_contrato}</td>
                        <td className="p-2">#{it.id_prestamo}</td>
                        <td className="p-2">{it.articulo ?? "—"}</td>
                        <td className="p-2">Q {Number(it.monto_prestamo ?? 0).toFixed(2)}</td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                              completo
                                ? "bg-emerald-500/15 text-emerald-400"
                                : parcial
                                ? "bg-yellow-500/15 text-yellow-400"
                                : "bg-neutral-500/15 text-neutral-400"
                            }`}
                          >
                            {completo ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                            {completo ? "Completado" : parcial ? "Parcial" : "Pendiente"}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <a
                              href={urlVerContrato(it.id_contrato)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                              title="Ver en visor"
                            >
                              <Eye className="size-3.5" />
                              Ver
                            </a>
                            <a
                              href={urlAbrirContrato(it.id_contrato)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                              title="Descargar/Abrir"
                            >
                              <Download className="size-3.5" />
                              PDF
                            </a>
                            <Link
                              href={`/dashboard/contratos/${it.id_contrato}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium hover:bg-blue-500"
                            >
                              Ver detalle
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data.total > data.limit && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-400">
                Mostrando {data.items.length} de {data.total}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!canPrev}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  disabled={!canNext}
                  onClick={() => setOffset(offset + limit)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
