// src/app/(app)/dashboard/usuarios/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  listAdminUsuarios,
  patchEstadoUsuario,
  resetearPasswordUsuario,
  type AdminUsuario,
  type ListAdminUsuariosParams,
} from "@/app/services/adminUsuarios";
import ActividadDrawer from "./ActividadDrawer";
import UsuarioRolesModal from "./UsuarioRolesModal";
import Badge from "@/components/ui/Badge";
import {
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCog,
  Eye,
  KeyRound,
  Shield,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";

export default function UsuariosAdminPage() {
  // Estados principales
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<AdminUsuario[]>([]);
  const [total, setTotal] = React.useState(0);

  // Filtros
  const [q, setQ] = React.useState("");
  const [activo, setActivo] = React.useState<"" | "true" | "false">("");
  const [rol, setRol] = React.useState("");
  const [verificado, setVerificado] = React.useState<"" | "true" | "false">("");

  // Ordenamiento y paginación
  const [sort, setSort] = React.useState<ListAdminUsuariosParams["sort"]>("fecha_alta");
  const [dir, setDir] = React.useState<ListAdminUsuariosParams["dir"]>("desc");
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);

  // Modales y drawers
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerUser, setDrawerUser] = React.useState<{ id: number; nombre: string } | null>(null);
  const [rolesModalOpen, setRolesModalOpen] = React.useState(false);
  const [rolesUser, setRolesUser] = React.useState<{
    id: number;
    nombre: string;
    correo: string;
  } | null>(null);

  // Cargar datos
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
      setRows(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar usuarios");
      toast.error("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, [q, activo, rol, verificado, sort, dir, limit, offset]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Acciones
  async function onToggleEstado(u: AdminUsuario) {
    const nuevo = !u.estado_activo;
    const accion = nuevo ? "activar" : "desactivar";

    if (!confirm(`¿Seguro que deseas ${accion} a ${u.nombre}?`)) return;

    try {
      await patchEstadoUsuario(u.id, nuevo);
      setRows((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, estado_activo: nuevo } : x))
      );
      toast.success(`Usuario ${nuevo ? "activado" : "desactivado"} correctamente`);
    } catch (e: any) {
      toast.error(e?.message ?? `No se pudo ${accion} el usuario`);
    }
  }

  async function onResetPassword(u: AdminUsuario) {
    const motivo = prompt(
      `Motivo para resetear la contraseña de ${u.nombre}:`,
      "Solicitud del usuario"
    );
    if (motivo === null) return;

    try {
      await resetearPasswordUsuario(u.id, motivo || "Sin motivo especificado");
      toast.success("Contraseña reseteada. El usuario deberá cambiarla al iniciar sesión.");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo resetear la contraseña");
    }
  }

  function openActividad(u: AdminUsuario) {
    setDrawerUser({ id: u.id, nombre: u.nombre });
    setDrawerOpen(true);
  }

  function openRoles(u: AdminUsuario) {
    setRolesUser({ id: u.id, nombre: u.nombre, correo: u.correo });
    setRolesModalOpen(true);
  }

  // Paginación
  const canPrev = offset > 0;
  const canNext = offset + limit < total;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2.5">
              <Users className="size-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
              <p className="text-sm text-neutral-400">
                Administra usuarios, roles y permisos del sistema
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          <RotateCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </button>
      </div>

      {/* Filtros avanzados */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-300">
          <Filter className="size-4" />
          Filtros de búsqueda
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {/* Búsqueda por texto */}
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full rounded-xl border border-white/10 bg-neutral-900 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              placeholder="Buscar por nombre o correo..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOffset(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchData();
              }}
            />
          </div>

          {/* Filtro estado */}
          <select
            className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={activo}
            onChange={(e) => {
              setActivo(e.target.value as any);
              setOffset(0);
            }}
          >
            <option value="">Estado: Todos</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>

          {/* Filtro rol */}
          <input
            className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Filtrar por rol..."
            value={rol}
            onChange={(e) => {
              setRol(e.target.value);
              setOffset(0);
            }}
          />

          {/* Filtro verificado */}
          <select
            className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={verificado}
            onChange={(e) => {
              setVerificado(e.target.value as any);
              setOffset(0);
            }}
          >
            <option value="">Verificación: Todos</option>
            <option value="true">Solo verificados</option>
            <option value="false">No verificados</option>
          </select>
        </div>

        {/* Ordenamiento */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400">Ordenar por:</span>
          <select
            className="rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-xs outline-none"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="fecha_alta">Fecha de alta</option>
            <option value="nombre">Nombre</option>
            <option value="correo">Correo</option>
            <option value="ultimo_login">Último login</option>
            <option value="actualizado">Actualizado</option>
          </select>
          <select
            className="rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-xs outline-none"
            value={dir}
            onChange={(e) => setDir(e.target.value as any)}
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
      </div>

      {/* Tabla de usuarios */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12">
          <div className="text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-blue-400" />
            <p className="mt-3 text-sm text-neutral-400">Cargando usuarios...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-400" />
            <div>
              <div className="font-medium text-red-400">Error al cargar</div>
              <div className="mt-1 text-sm text-red-300">{error}</div>
            </div>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <Users className="mx-auto size-12 text-neutral-600" />
          <p className="mt-3 font-medium text-neutral-300">No se encontraron usuarios</p>
          <p className="mt-1 text-sm text-neutral-400">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      ) : (
        <>
          {/* Stats rápidos */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-neutral-400">Total usuarios</div>
              <div className="mt-1 text-2xl font-bold">{total}</div>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="text-sm text-neutral-400">Activos</div>
              <div className="mt-1 text-2xl font-bold text-emerald-400">
                {rows.filter((r) => r.estado_activo).length}
              </div>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="text-sm text-neutral-400">Inactivos</div>
              <div className="mt-1 text-2xl font-bold text-red-400">
                {rows.filter((r) => !r.estado_activo).length}
              </div>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
              <div className="text-sm text-neutral-400">Mostrando</div>
              <div className="mt-1 text-2xl font-bold text-purple-400">{rows.length}</div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-neutral-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Usuario</th>
                    <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                      Correo
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Roles</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">
                      Fecha alta
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((u) => (
                    <tr
                      key={u.id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 font-semibold text-blue-400">
                            {u.nombre
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{u.nombre}</div>
                            <div className="mt-0.5 text-xs text-neutral-400 md:hidden">
                              {u.correo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="text-neutral-300">{u.correo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.slice(0, 2).map((r) => (
                              <Badge key={r} variant="info">
                                <Shield className="size-3" />
                                {r}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="default">Sin roles</Badge>
                          )}
                          {u.roles && u.roles.length > 2 && (
                            <Badge variant="default">+{u.roles.length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onToggleEstado(u)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                            u.estado_activo
                              ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                              : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                          }`}
                        >
                          <div
                            className={`size-1.5 rounded-full ${
                              u.estado_activo ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          {u.estado_activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <div className="text-xs text-neutral-400">
                          {u.fecha_alta
                            ? new Date(u.fecha_alta).toLocaleDateString("es", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/usuarios/${u.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
                            title="Ver detalles"
                          >
                            <Eye className="size-3.5" />
                            <span className="hidden sm:inline">Ver</span>
                          </Link>
                          <button
                            onClick={() => openRoles(u)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600/20 px-2.5 py-1.5 text-xs text-purple-400 hover:bg-purple-600/30"
                            title="Gestionar roles"
                          >
                            <UserCog className="size-3.5" />
                            <span className="hidden sm:inline">Roles</span>
                          </button>
                          <button
                            onClick={() => openActividad(u)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/20 px-2.5 py-1.5 text-xs text-blue-400 hover:bg-blue-600/30"
                            title="Ver actividad"
                          >
                            <Shield className="size-3.5" />
                            <span className="hidden sm:inline">Log</span>
                          </button>
                          <button
                            onClick={() => onResetPassword(u)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-600/20 px-2.5 py-1.5 text-xs text-yellow-400 hover:bg-yellow-600/30"
                            title="Resetear contraseña"
                          >
                            <KeyRound className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-neutral-400">
              Mostrando <span className="font-medium text-white">{rows.length}</span> de{" "}
              <span className="font-medium text-white">{total}</span> usuarios
              {totalPages > 1 && (
                <>
                  {" "}
                  · Página <span className="font-medium text-white">{currentPage}</span> de{" "}
                  <span className="font-medium text-white">{totalPages}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                className="rounded-lg border border-white/10 bg-neutral-900 px-2 py-1.5 text-xs outline-none"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
              >
                <option value={10}>10 / página</option>
                <option value={20}>20 / página</option>
                <option value={50}>50 / página</option>
                <option value={100}>100 / página</option>
              </select>

              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={!canPrev}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </button>

              <button
                onClick={() => setOffset(offset + limit)}
                disabled={!canNext}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modales */}
      <ActividadDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userId={drawerUser?.id ?? null}
        userName={drawerUser?.nombre}
      />

      <UsuarioRolesModal
        open={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
        userId={rolesUser?.id ?? null}
        userName={rolesUser?.nombre}
        userEmail={rolesUser?.correo}
        onChanged={fetchData}
      />
    </div>
  );
}