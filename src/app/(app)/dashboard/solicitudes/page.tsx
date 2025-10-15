// src/app/(app)/dashboard/solicitudes/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listMisSolicitudes, type Solicitud } from "@/app/services/solicitudes";
import { RotateCw, Plus, Search, AlertCircle } from "lucide-react";
import ProtectedAction from "@/components/ProtectedAction";
import { usePermiso } from "@/hooks/usePermiso";

type Estado = "pendiente" | "aprobado" | "rechazado" | string;

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
}

export default function SolicitudesPage() {
  const router = useRouter();
  const puedeVer = usePermiso("solicitudes.view");
  const puedeCrear = usePermiso("solicitudes.create");
  
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Solicitud[]>([]);
  const [q, setQ] = React.useState<string>("");
  const [estado, setEstado] = React.useState<Estado | "todos">("todos");

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listMisSolicitudes();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Verificar permiso antes de cargar datos
    if (!puedeVer) {
      setError("No tienes permiso para ver solicitudes");
      setLoading(false);
      return;
    }
    void refresh();
  }, [refresh, puedeVer]);

  const filtered = React.useMemo(() => {
    const text = q.trim().toLowerCase();
    return items.filter((s) => {
      const byEstado = estado === "todos" ? true : s.estado === estado;
      const hayTexto =
        text.length === 0 ||
        String(s.id_solicitud).includes(text) ||
        (s.codigo ?? "").toLowerCase().includes(text) ||
        (s.metodo_entrega ?? "").toLowerCase().includes(text) ||
        (s.estado ?? "").toLowerCase().includes(text);
      return byEstado && hayTexto;
    });
  }, [items, q, estado]);

  // Si no tiene permiso de ver, mostrar mensaje
  if (!puedeVer) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-400" />
            <div>
              <div className="font-medium text-red-400">Acceso denegado</div>
              <div className="mt-1 text-sm text-red-300">
                No tienes permiso para ver las solicitudes. Contacta al administrador.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header + acciones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Solicitudes</h1>
          <p className="text-sm text-neutral-400">
            Crea, revisa y filtra tus solicitudes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
            title="Refrescar"
          >
            <RotateCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
          
          {/* Botón protegido por permiso */}
          <ProtectedAction 
            permiso="solicitudes.create"
            fallback={
              <div 
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                title="No tienes permiso para crear solicitudes"
              >
                <Plus className="size-4" />
                Nueva solicitud
              </div>
            }
          >
            <Link
              href="/dashboard/solicitudes/nueva"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
            >
              <Plus className="size-4" />
              Nueva solicitud
            </Link>
          </ProtectedAction>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full rounded-xl bg-neutral-900 pl-9 pr-3 py-2 text-sm border border-white/10 outline-none focus:border-blue-500"
            placeholder="Buscar por #, código, estado…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>

        <select
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm border border-white/10 outline-none focus:border-blue-500"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_revision">En revisión</option>
          <option value="evaluada">Evaluada</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>

      {/* Lista / estados */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
          <div className="flex items-center gap-2">
            <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Cargando solicitudes…
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-400" />
            <span>{error}</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="text-sm text-neutral-300">
            {items.length === 0 
              ? "No tienes solicitudes aún." 
              : "No hay resultados para tu filtro."}
          </div>
          {items.length === 0 && puedeCrear && (
            <Link
              href="/dashboard/solicitudes/nueva"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              <Plus className="size-4" />
              Crear primera solicitud
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Tabla (md+) */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-neutral-300">
                <tr>
                  <th className="px-4 py-3 text-left">Solicitud</th>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Método</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id_solicitud}
                    className="border-t border-white/10 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/solicitudes/${s.id_solicitud}`}
                        className="text-blue-400 hover:underline"
                      >
                        #{s.id_solicitud}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">
                        {s.codigo ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        s.estado === "pendiente" ? "bg-yellow-500/15 text-yellow-400" :
                        s.estado === "aprobado" ? "bg-emerald-500/15 text-emerald-400" :
                        s.estado === "rechazado" ? "bg-red-500/15 text-red-400" :
                        "bg-blue-500/15 text-blue-400"
                      }`}>
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {s.metodo_entrega ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(s.fecha_envio)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/solicitudes/${s.id_solicitud}`}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (móvil) */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((s) => (
              <Link
                key={s.id_solicitud}
                href={`/dashboard/solicitudes/${s.id_solicitud}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">#{s.id_solicitud}</div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                    s.estado === "pendiente" ? "bg-yellow-500/15 text-yellow-400" :
                    s.estado === "aprobado" ? "bg-emerald-500/15 text-emerald-400" :
                    s.estado === "rechazado" ? "bg-red-500/15 text-red-400" :
                    "bg-blue-500/15 text-blue-400"
                  }`}>
                    {s.estado}
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-neutral-400">Código</dt>
                    <dd className="mt-0.5 font-mono text-xs">{s.codigo ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">Método</dt>
                    <dd className="mt-0.5 capitalize">
                      {s.metodo_entrega ?? "—"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-neutral-400">Fecha</dt>
                    <dd className="mt-0.5">{formatDate(s.fecha_envio)}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>

          {/* Resumen */}
          <div className="text-sm text-neutral-400">
            Mostrando {filtered.length} de {items.length} solicitud(es)
          </div>
        </>
      )}
    </div>
  );
}