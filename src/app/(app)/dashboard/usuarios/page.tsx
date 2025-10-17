// src/app/(app)/dashboard/usuarios/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  listAdminUsuarios,
  type AdminUsuario,
  type ListAdminUsuariosParams,
} from "@/app/services/adminUsuarios";
import { Search, Filter, RefreshCcw, CheckCircle2, XCircle, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";

/* ========= Types ========= */
type BoolStr = "all" | "true" | "false";

type FiltrosState = {
  q: string;
  activo: BoolStr;
  rol: string;
  verificado: BoolStr;
  sort: NonNullable<ListAdminUsuariosParams["sort"]>;
  dir: NonNullable<ListAdminUsuariosParams["dir"]>;
  limit: number;
  offset: number;
};

/* ========= Utils ========= */
function boolStrToBool(v: BoolStr): boolean | null {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

function safeDate(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

/* ========= Page ========= */
export default function UsuariosPage() {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [items, setItems] = React.useState<AdminUsuario[]>([]);
  const [total, setTotal] = React.useState<number>(0);

  const [filtros, setFiltros] = React.useState<FiltrosState>({
    q: "",
    activo: "all",
    rol: "",
    verificado: "all",
    sort: "nombre",
    dir: "asc",
    limit: 20,
    offset: 0,
  });

  const canPrev = filtros.offset > 0;
  const canNext = filtros.offset + filtros.limit < total;

  const handleChangeTexto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFiltros((s) => ({ ...s, [name]: value, offset: 0 }));
  };

  const handleChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((s) => ({ ...s, [name]: value, offset: 0 }));
  };

  const handleSort = (campo: NonNullable<ListAdminUsuariosParams["sort"]>) => {
    setFiltros((s) => {
      const newDir: FiltrosState["dir"] =
        s.sort === campo ? (s.dir === "asc" ? "desc" : "asc") : "asc";
      return { ...s, sort: campo, dir: newDir, offset: 0 };
    });
  };

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: ListAdminUsuariosParams = {
        q: filtros.q || null,
        activo: boolStrToBool(filtros.activo),
        rol: filtros.rol || null,
        verificado: boolStrToBool(filtros.verificado),
        sort: filtros.sort,
        dir: filtros.dir,
        limit: filtros.limit,
        offset: filtros.offset,
      };

      const data = await listAdminUsuarios(params);
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudieron cargar los usuarios";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onPrevPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!canPrev) return;
    setFiltros((s) => ({ ...s, offset: Math.max(0, s.offset - s.limit) }));
  };

  const onNextPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!canNext) return;
    setFiltros((s) => ({ ...s, offset: s.offset + s.limit }));
  };

  const onRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    void fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-neutral-300">
            {total} total
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/usuarios/nuevo"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
          >
            <UserPlus className="size-4" />
            Nuevo usuario
          </Link>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <RefreshCcw className="size-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-neutral-400">
          <Filter className="size-4" />
          Filtros
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              name="q"
              value={filtros.q}
              onChange={handleChangeTexto}
              placeholder="Buscar por nombre o correo…"
              className="w-full rounded-lg border border-white/10 bg-neutral-900 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            name="activo"
            value={filtros.activo}
            onChange={handleChangeSelect}
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">Todos (activo/inactivo)</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>

          <input
            name="rol"
            value={filtros.rol}
            onChange={handleChangeTexto}
            placeholder="Filtrar por rol… (ej: ADMIN)"
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          <select
            name="verificado"
            value={filtros.verificado}
            onChange={handleChangeSelect}
            className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">Verificados y no verificados</option>
            <option value="true">Solo verificados</option>
            <option value="false">Solo no verificados</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="text-left text-neutral-400">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort("nombre")}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  Nombre
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort("fecha_alta")}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  Alta
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => handleSort("ultimo_login")}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  Últ. acceso
                </button>
              </th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-neutral-400" colSpan={8}>
                  Cargando…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-6 text-red-400" colSpan={8}>
                  {error}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-neutral-400" colSpan={8}>
                  No hay usuarios que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              items.map((u) => {
                const activo = u.estado_activo;
                return (
                  <tr key={u.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/usuarios/${u.id}`}
                        className="text-blue-400 hover:underline"
                      >
                        #{u.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{u.correo}</td>
                    <td className="px-4 py-3">{u.nombre}</td>
                    <td className="px-4 py-3">{safeDate(u.fecha_alta)}</td>
                    <td className="px-4 py-3">{safeDate(u.ultimo_login)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles ?? []).slice(0, 3).map((r) => (
                          <span
                            key={`${u.id}-${r}`}
                            className="rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-neutral-300"
                          >
                            {r}
                          </span>
                        ))}
                        {(u.roles?.length ?? 0) > 3 && (
                          <span className="text-xs text-neutral-400">+{(u.roles?.length ?? 0) - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={classNames(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs",
                          activo
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border border-red-500/30 bg-red-500/10 text-red-400"
                        )}
                      >
                        {activo ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        {activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/usuarios/${u.id}`}
                        className="text-blue-400 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">
          Mostrando {items.length} de {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            disabled={!canPrev}
            className={classNames(
              "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm",
              canPrev ? "border-white/10 hover:bg-white/5" : "cursor-not-allowed border-white/5 opacity-50"
            )}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </button>
          <button
            onClick={onNextPage}
            disabled={!canNext}
            className={classNames(
              "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm",
              canNext ? "border-white/10 hover:bg-white/5" : "cursor-not-allowed border-white/5 opacity-50"
            )}
          >
            Siguiente
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
