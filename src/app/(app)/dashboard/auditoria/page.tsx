"use client";

import * as React from "react";
import api from "@/lib/api";
import { Search, RotateCw, Filter, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

/* ============================================================
   Tipos
   ============================================================ */
type UsuarioMini = { id: number; nombre: string | null };
type JsonObj = Record<string, unknown>;

type AuditItem = {
  id_auditoria: number;
  usuario: UsuarioMini | null;
  modulo: string;
  accion: string;
  fecha_hora: string;
  detalle: string | null;
  old_values: JsonObj | null;
  new_values: JsonObj | null;
};

type Paged<T> = { items?: T[]; total?: number; limit?: number; offset?: number; sort?: string };
type AuditListResp = Paged<AuditItem> | AuditItem[];

/* ============================================================
   Helpers
   ============================================================ */
function asArray<T>(data: Paged<T> | T[]): T[] {
  return Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
}

function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Error desconocido";
}

/* ============================================================
   API
   ============================================================ */
async function fetchAuditoria(params?: Record<string, string | number | boolean>): Promise<AuditItem[]> {
  const { data } = await api.get<AuditListResp>("/auditoria", { params });
  return asArray<AuditItem>(data);
}

/* ============================================================
   Página principal
   ============================================================ */
export default function AuditoriaPage(): React.ReactElement {
  const [auditorias, setAuditorias] = React.useState<AuditItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busqueda, setBusqueda] = React.useState("");
  const [pagina, setPagina] = React.useState(0);
  const [limite] = React.useState(10);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuditoria();
      setAuditorias(data);
    } catch (e: unknown) {
      setError(getErrMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtradas = auditorias.filter((a) => {
    const term = busqueda.toLowerCase();
    return (
      a.modulo.toLowerCase().includes(term) ||
      a.accion.toLowerCase().includes(term) ||
      (a.detalle ?? "").toLowerCase().includes(term)
    );
  });

  const paginadas = filtradas.slice(pagina * limite, (pagina + 1) * limite);

  /* ============================================================
     Render
     ============================================================ */
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <Filter className="size-5 text-blue-400" />
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

      {/* Barra de búsqueda */}
      <div className="flex items-center gap-2">
        <Search className="text-neutral-400" />
        <input
          type="text"
          placeholder="Buscar por módulo, acción o detalle…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Estado: Cargando */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-10 text-neutral-400">
          <RotateCw className="mr-2 animate-spin" />
          Cargando registros…
        </div>
      )}

      {/* Estado: Error */}
      {error && !loading && (
        <div className="flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          <AlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-400">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Fecha</th>
                  <th className="px-2 py-2">Usuario</th>
                  <th className="px-2 py-2">Módulo</th>
                  <th className="px-2 py-2">Acción</th>
                  <th className="px-2 py-2">Detalle</th>
                </tr>
              </thead>
              <tbody className="text-neutral-200">
                {paginadas.map((a) => (
                  <tr key={a.id_auditoria} className="border-t border-white/10">
                    <td className="px-2 py-2">{a.id_auditoria}</td>
                    <td className="px-2 py-2">{new Date(a.fecha_hora).toLocaleString()}</td>
                    <td className="px-2 py-2">{a.usuario?.nombre ?? `ID ${a.usuario?.id ?? "?"}`}</td>
                    <td className="px-2 py-2">{a.modulo}</td>
                    <td className="px-2 py-2">{a.accion}</td>
                    <td className="px-2 py-2">{a.detalle ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sin datos */}
          {paginadas.length === 0 && (
            <div className="py-6 text-center text-neutral-400">Sin resultados</div>
          )}

          {/* Paginación */}
          <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
            <button
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={pagina === 0}
              className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> Anterior
            </button>
            <div>
              Página {pagina + 1} de {Math.ceil(filtradas.length / limite) || 1}
            </div>
            <button
              onClick={() => setPagina((p) => (p + 1) * limite < filtradas.length ? p + 1 : p)}
              disabled={(pagina + 1) * limite >= filtradas.length}
              className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10 disabled:opacity-40"
            >
              Siguiente <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
