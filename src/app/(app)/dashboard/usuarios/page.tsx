// src/app/(app)/dashboard/usuarios/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCw, ChevronLeft, ChevronRight, Shield, RefreshCcw, KeyRound, Users as UsersIcon } from "lucide-react";
import { usePermiso } from "@/hooks/usePermiso";
import {
  listAdminUsuarios,
  patchEstadoUsuario,
  resetearPasswordUsuario,
  type AdminUsuario,
  type ListAdminUsuariosParams,
} from "@/app/services/adminUsuarios";

function fmt(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
}

export default function AdminUsuariosPage() {
  // Permisos (ajusta los códigos a los tuyos)
  const puedeVer = usePermiso(["usuarios.view", "usuarios.admin"]);
  const puedeEditar = usePermiso(["usuarios.update", "usuarios.admin"]);
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<AdminUsuario[]>([]);
  const [total, setTotal] = React.useState(0);

  // Filtros
  const [q, setQ] = React.useState("");
  const [activo, setActivo] = React.useState<"" | "true" | "false">("");
  const [rol, setRol] = React.useState("");
  const [verificado, setVerificado] = React.useState<"" | "true" | "false">("");
  const [sort, setSort] = React.useState<ListAdminUsuariosParams["sort"]>("fecha_alta");
  const [dir, setDir] = React.useState<ListAdminUsuariosParams["dir"]>("desc");

  // Paginación
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: ListAdminUsuariosParams = {
        q: q || null,
        activo: activo === "" ? null : activo === "true",
        rol: rol || null,
        verificado: verificado === "" ? null : verificado === "true",
        sort,
        dir,
        limit,
        offset,
      };
      const res = await listAdminUsuarios(params);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [q, activo, rol, verificado, sort, dir, limit, offset]);

  React.useEffect(() => { if (puedeVer) void fetchData(); else { setLoading(false); setError("Acceso denegado"); }}, [fetchData, puedeVer]);

  function nextPage() {
    if (offset + limit >= total) return;
    setOffset((o) => o + limit);
  }
  function prevPage() {
    setOffset((o) => Math.max(0, o - limit));
  }

  async function onToggleEstado(u: AdminUsuario) {
    if (!puedeEditar) return;
    const ok = confirm(`¿Cambiar estado de ${u.nombre || u.correo} a ${u.estado_activo ? "Inactivo" : "Activo"}?`);
    if (!ok) return;
    await patchEstadoUsuario(u.id, !u.estado_activo);
    await fetchData();
  }

  async function onResetPassword(u: AdminUsuario) {
    if (!puedeEditar) return;
    const motivo = prompt(`Motivo para resetear la contraseña de ${u.nombre || u.correo}:`, "Soporte");
    if (motivo === null) return;
    await resetearPasswordUsuario(u.id, motivo || "Soporte");
    alert("Se reseteó la contraseña e invalidaron sesiones activas (si aplica).");
  }

  if (!puedeVer) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        Acceso denegado
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="size-5 text-blue-400" />
          <h1 className="text-2xl font-semibold">Usuarios (Admin)</h1>
        </div>
        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          title="Refrescar"
        >
          <RotateCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </button>
      </div>

      {/* Filtros */}
      <div className="grid gap-3 md:grid-cols-5">
        <label className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full rounded-xl bg-neutral-900 pl-9 pr-3 py-2 text-sm border border-white/10 outline-none focus:border-blue-500"
            placeholder="Buscar por nombre/correo…"
            value={q}
            onChange={(e) => { setOffset(0); setQ(e.target.value); }}
          />
        </label>
        <select
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm border border-white/10 outline-none"
          value={activo}
          onChange={(e) => { setOffset(0); setActivo(e.target.value as any); }}
        >
          <option value="">Activo: todos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
        <input
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm border border-white/10 outline-none"
          placeholder="Rol (nombre o ID)"
          value={rol}
          onChange={(e) => { setOffset(0); setRol(e.target.value); }}
        />
        <select
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm border border-white/10 outline-none"
          value={verificado}
          onChange={(e) => { setOffset(0); setVerificado(e.target.value as any); }}
        >
          <option value="">Verificado: todos</option>
          <option value="true">Solo verificados</option>
          <option value="false">Solo no verificados</option>
        </select>

        <div className="grid gap-3 md:grid-cols-3 md:col-span-5">
          <div className="grid grid-cols-2 gap-2">
            <select
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm border border-white/10 outline-none"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <option value="fecha_alta">Ordenar: Fecha alta</option>
              <option value="nombre">Nombre</option>
              <option value="correo">Correo</option>
              <option value="ultimo_login">Último login</option>
              <option value="actualizado">Actualizado</option>
            </select>
            <select
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm border border-white/10 outline-none"
              value={dir}
              onChange={(e) => setDir(e.target.value as any)}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <button
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
              onClick={() => { setOffset(0); void fetchData(); }}
            >
              <RefreshCcw className="size-4" /> Aplicar
            </button>
            <div className="text-sm text-neutral-400 text-center">
              {total} resultado(s)
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                className="rounded-lg border border-white/10 p-2 hover:bg-white/5 disabled:opacity-40"
                onClick={prevPage}
                disabled={offset === 0}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                className="rounded-lg border border-white/10 p-2 hover:bg-white/5 disabled:opacity-40"
                onClick={nextPage}
                disabled={offset + limit >= total}
              >
                <ChevronRight className="size-4" />
              </button>
              <select
                className="ml-1 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-sm"
                value={limit}
                onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)); }}
              >
                {[10,20,50,100,200].map(n => <option key={n} value={n}>{n}/pág</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
          Cargando usuarios…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-neutral-300">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Correo</th>
                <th className="px-4 py-3 text-left">Roles</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Último login</th>
                <th className="px-4 py-3 text-left">Alta</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td className="px-4 py-6 text-neutral-400" colSpan={7}>Sin resultados</td></tr>
              ) : items.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{u.nombre || "—"}</td>
                  <td className="px-4 py-3">{u.correo}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map(r => (
                        <span key={r} className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-400">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={!puedeEditar}
                      onClick={() => onToggleEstado(u)}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.estado_activo ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                      } ${!puedeEditar ? "opacity-50 cursor-not-allowed" : ""}`}
                      title={puedeEditar ? "Cambiar estado" : "Sin permiso"}
                    >
                      {u.estado_activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">{fmt(u.ultimo_login)}</td>
                  <td className="px-4 py-3">{fmt(u.fecha_alta)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        className="text-xs text-blue-400 hover:underline"
                        href={`/dashboard/usuarios/${u.id}/actividad`}
                        title="Ver actividad"
                      >
                        Ver actividad
                      </a>
                      <button
                        onClick={() => onResetPassword(u)}
                        disabled={!puedeEditar}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5 disabled:opacity-50"
                        title="Resetear password"
                      >
                        <KeyRound className="size-3.5" /> Reset
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/perfil?impersonate=${u.id}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                        title="(Ejemplo) Ir a perfil"
                      >
                        <Shield className="size-3.5" /> Impersonar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
