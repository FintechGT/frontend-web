// src/app/(app)/dashboard/usuarios/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getUsuarioDetalle,
  listarRolesDisponibles,
  listarRolesDeUsuario,
  asignarRolAUsuario,
  quitarRolDeUsuario,
  getActividadUsuario,
  type RolItem,
  type ActividadItem,
} from "@/app/services/adminUsuarios";
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  Shield,
  Trash2,
  Plus,
  Search,
  Calendar,
  Mail,
} from "lucide-react";

export default function UsuarioShowPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = Number(params?.id);

  const [tab, setTab] = React.useState<"perfil" | "roles" | "actividad">("perfil");

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [perfil, setPerfil] = React.useState<{
    id: number;
    nombre: string;
    correo: string;
    telefono?: string | null;
    direccion?: string | null;
    verificado?: boolean;
    estado_activo: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  } | null>(null);

  // Roles
  const [rolesActuales, setRolesActuales] = React.useState<string[]>([]);
  const [rolesDisp, setRolesDisp] = React.useState<RolItem[]>([]);
  const [filter, setFilter] = React.useState("");

  // Actividad
  const [actLoading, setActLoading] = React.useState(false);
  const [actividad, setActividad] = React.useState<ActividadItem[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [u, ract, rdisp] = await Promise.all([
          getUsuarioDetalle(userId),
          listarRolesDeUsuario(userId),
          listarRolesDisponibles(),
        ]);
        if (!alive) return;
        setPerfil(u);
        setRolesActuales(ract);
        setRolesDisp(rdisp);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "No se pudo cargar el usuario");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  async function loadActividad() {
    try {
      setActLoading(true);
      const r = await getActividadUsuario(userId, { limit: 50, offset: 0 });
      setActividad(r.items ?? []);
    } finally {
      setActLoading(false);
    }
  }

  React.useEffect(() => {
    if (tab === "actividad") loadActividad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function onAsignar(id_rol: number) {
    await asignarRolAUsuario(userId, id_rol);
    const r = await listarRolesDeUsuario(userId);
    setRolesActuales(r);
  }

  async function onQuitar(rolNombre: string) {
    const rol = rolesDisp.find((r) => r.nombre.toUpperCase() === rolNombre.toUpperCase());
    if (!rol) return alert("No se encontró el rol en el catálogo");
    await quitarRolDeUsuario(userId, rol.id_rol);
    const r = await listarRolesDeUsuario(userId);
    setRolesActuales(r);
  }

  const filteredDisp = React.useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rolesDisp;
    return rolesDisp.filter((r) => r.nombre.toLowerCase().includes(f));
  }, [filter, rolesDisp]);

  return (
    <div className="p-4 mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/usuarios")}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
        <div className="text-sm text-neutral-400">ID: {Number.isFinite(userId) ? userId : "—"}</div>
      </div>

      {loading ? (
        <div className="text-neutral-300 flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Cargando usuario…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
          {error}
        </div>
      ) : !perfil ? (
        <div className="text-neutral-300">No se encontró el usuario.</div>
      ) : (
        <>
          {/* Header del usuario */}
          <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold truncate">{perfil.nombre}</h1>
                  {perfil.verificado && (
                    <span title="Verificado">
                      <BadgeCheck className="size-4 text-sky-400" aria-label="Verificado" role="img" />
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-neutral-400 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3.5" /> {perfil.correo}
                  </span>
                  {perfil.created_at && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      Alta: {new Date(perfil.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`rounded px-2 py-1 text-xs ${
                  perfil.estado_activo ? "bg-emerald-600" : "bg-neutral-700"
                }`}
              >
                {perfil.estado_activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10">
            <nav className="flex gap-3">
              {(["perfil", "roles", "actividad"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-sm border-b-2 -mb-px ${
                    tab === t
                      ? "border-white text-white"
                      : "border-transparent text-neutral-400 hover:text-white"
                  }`}
                >
                  {t === "perfil" ? "Perfil" : t === "roles" ? "Roles" : "Actividad"}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido de cada pestaña */}
          {tab === "perfil" && (
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 p-4">
                <div className="text-sm text-neutral-400">Teléfono</div>
                <div className="mt-1">{perfil.telefono ?? "—"}</div>
              </div>
              <div className="rounded-xl border border-white/10 p-4">
                <div className="text-sm text-neutral-400">Dirección</div>
                <div className="mt-1 break-words">{perfil.direccion ?? "—"}</div>
              </div>
            </section>
          )}

          {tab === "roles" && (
            <section className="grid gap-4 lg:grid-cols-2">
              {/* Roles actuales */}
              <div className="rounded-xl border border-white/10 p-4">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="size-4" />
                  Roles asignados
                </div>
                <div className="flex flex-wrap gap-2">
                  {rolesActuales.length ? (
                    rolesActuales.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs"
                      >
                        {r}
                        <button
                          onClick={() => onQuitar(r)}
                          className="ml-1 hover:text-rose-400"
                          title="Quitar"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-400 text-sm">Sin roles</span>
                  )}
                </div>
              </div>

              {/* Asignar rol */}
              <div className="rounded-xl border border-white/10 p-4 space-y-2">
                <div className="text-sm font-medium">Asignar rol</div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 size-4 text-neutral-400" />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filtra por nombre…"
                    className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-8 pr-3 text-sm outline-none"
                  />
                </div>
                <div className="max-h-72 overflow-auto rounded-lg border border-white/10">
                  <ul className="divide-y divide-white/5">
                    {filteredDisp.map((r) => {
                      const ya = rolesActuales
                        .map((x) => x.toUpperCase())
                        .includes(r.nombre.toUpperCase());
                      return (
                        <li key={r.id_rol} className="flex items-center justify-between p-2 text-sm">
                          <div>{r.nombre}</div>
                          <button
                            disabled={ya}
                            onClick={() => onAsignar(r.id_rol)}
                            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
                              ya
                                ? "bg-neutral-700 text-neutral-300"
                                : "bg-sky-600 hover:bg-sky-500 text-white"
                            }`}
                          >
                            <Plus className="size-3.5" /> Asignar
                          </button>
                        </li>
                      );
                    })}
                    {filteredDisp.length === 0 && (
                      <li className="p-3 text-sm text-neutral-400">No hay roles para mostrar.</li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {tab === "actividad" && (
            <section className="rounded-xl border border-white/10 p-4">
              {actLoading ? (
                <div className="text-neutral-300 flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando actividad…
                </div>
              ) : (
                <ul className="space-y-3">
                  {actividad.map((a) => (
                    <li key={a.id_auditoria} className="rounded-lg border border-white/10 p-3">
                      <div className="text-xs text-neutral-400">
                        {new Date(a.fecha_hora).toLocaleString()} · {a.modulo} · {a.accion}
                      </div>
                      {a.detalle && <div className="mt-1 text-sm">{a.detalle}</div>}
                      {(a.old_values || a.new_values) && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-neutral-300">Ver cambios</summary>
                          <pre className="mt-1 whitespace-pre-wrap break-all text-neutral-300">
                            {a.old_values ? `OLD: ${a.old_values}\n` : ""}
                            {a.new_values ? `NEW: ${a.new_values}` : ""}
                          </pre>
                        </details>
                      )}
                    </li>
                  ))}
                  {actividad.length === 0 && (
                    <li className="text-neutral-400 text-sm">Sin actividad reciente.</li>
                  )}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
