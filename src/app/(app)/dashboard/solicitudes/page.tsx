// src/app/(app)/dashboard/solicitudes/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listMisSolicitudes, type Solicitud } from "@/app/services/solicitudes";
import { RotateCw, Plus, Search } from "lucide-react";

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
    void refresh();
  }, [refresh]);

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
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            title="Refrescar"
          >
            <RotateCw className="size-4" />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
          <Link
            href="/dashboard/solicitudes/nueva"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
          >
            <Plus className="size-4" />
            Nueva solicitud
          </Link>
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
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>

      {/* Lista / estados */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
          Cargando…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
          No hay resultados para tu filtro.
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
                    <td className="px-4 py-3">{s.codigo ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{s.estado}</td>
                    <td className="px-4 py-3">
                      {s.metodo_entrega ? s.metodo_entrega : "—"}
                    </td>
                    <td className="px-4 py-3">{formatDate(s.fecha_envio)}</td>
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
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">#{s.id_solicitud}</div>
                  <div className="text-xs text-neutral-400">
                    {formatDate(s.fecha_envio)}
                  </div>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-neutral-400">Código</dt>
                    <dd className="mt-0.5">{s.codigo ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">Estado</dt>
                    <dd className="mt-0.5 capitalize">{s.estado}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">Método</dt>
                    <dd className="mt-0.5">
                      {s.metodo_entrega ? s.metodo_entrega : "—"}
                    </dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
