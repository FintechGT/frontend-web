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
import Badge from "@/components/ui/Badge";
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
  Phone,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function UsuarioShowPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = Number(params?.id);

  const [tab, setTab] = React.useState<"perfil" | "roles" | "actividad">("perfil");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Perfil
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
      if (!Number.isFinite(userId)) {
        setError("ID de usuario inválido");
        setLoading(false);
        return;
      }

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
        toast.error("Error al cargar usuario");
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
    } catch (e: any) {
      toast.error("No se pudo cargar la actividad");
    } finally {
      setActLoading(false);
    }
  }

  React.useEffect(() => {
    if (tab === "actividad" && actividad.length === 0) {
      loadActividad();
    }
  }, [tab]);

  async function onAsignar(id_rol: number, nombre: string) {
    try {
      await asignarRolAUsuario(userId, id_rol);
      const r = await listarRolesDeUsuario(userId);
      setRolesActuales(r);
      toast.success(`Rol "${nombre}" asignado`);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo asignar el rol");
    }
  }

  async function onQuitar(rolNombre: string) {
    if (!confirm(`¿Quitar rol "${rolNombre}"?`)) return;

    const rol = rolesDisp.find((r) => r.nombre.toUpperCase() === rolNombre.toUpperCase());
    if (!rol) return;

    try {
      await quitarRolDeUsuario(userId, rol.id_rol);
      const r = await listarRolesDeUsuario(userId);
      setRolesActuales(r);
      toast.success(`Rol "${rolNombre}" removido`);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo quitar el rol");
    }
  }

  const filteredDisp = React.useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rolesDisp;
    return rolesDisp.filter((r) => r.nombre.toLowerCase().includes(f));
  }, [filter, rolesDisp]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/usuarios")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
        <Badge variant="default">ID: {userId}</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12">
          <div className="text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-blue-400" />
            <p className="mt-3 text-sm text-neutral-400">Cargando usuario...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="font-medium text-red-400">Error al cargar</div>
          <div className="mt-1 text-sm text-red-300">{error}</div>
        </div>
      ) : !perfil ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-neutral-300">No se encontró el usuario.</p>
        </div>
      ) : (
        <>
          {/* Card Perfil */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-2xl font-bold text-blue-400">
                  {perfil.nombre
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{perfil.nombre}</h1>
                    {perfil.verificado && (
                      <Badge variant="success">
                        <BadgeCheck className="size-3" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                      <Mail className="size-4 text-neutral-400" />
                      {perfil.correo}
                    </div>
                    {perfil.telefono && (
                      <div className="flex items-center gap-2 text-sm text-neutral-300">
                        <Phone className="size-4 text-neutral-400" />
                        {perfil.telefono}
                      </div>
                    )}
                    {perfil.direccion && (
                      <div className="flex items-center gap-2 text-sm text-neutral-300">
                        <MapPin className="size-4 text-neutral-400" />
                        {perfil.direccion}
                      </div>
                    )}
                    {perfil.created_at && (
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Calendar className="size-4" />
                        Miembro desde{" "}
                        {new Date(perfil.created_at).toLocaleDateString("es", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estado */}
              <Badge variant={perfil.estado_activo ? "success" : "error"}>
                <div
                  className={`size-2 rounded-full ${
                    perfil.estado_activo ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                {perfil.estado_activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10">
            <nav className="flex gap-1">
              {(["perfil", "roles", "actividad"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 px-4 py-3 text-sm font-medium capitalize transition ${
                    tab === t
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-neutral-400 hover:text-neutral-300"
                  }`}
                >
                  {t === "perfil" && <User className="mr-2 inline size-4" />}
                  {t === "roles" && <Shield className="mr-2 inline size-4" />}
                  {t === "actividad" && <Clock className="mr-2 inline size-4" />}
                  {t}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido por Tab */}
          {tab === "perfil" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-1 text-sm text-neutral-400">Teléfono</div>
                <div className="text-lg font-medium">
                  {perfil.telefono || "No registrado"}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-1 text-sm text-neutral-400">Dirección</div>
                <div className="text-lg font-medium">
                  {perfil.direccion || "No registrada"}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-1 text-sm text-neutral-400">Verificación</div>
                <div className="text-lg font-medium">
                  {perfil.verificado ? (
                    <Badge variant="success">Verificado</Badge>
                  ) : (
                    <Badge variant="warning">Pendiente</Badge>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-1 text-sm text-neutral-400">Última actualización</div>
                <div className="text-sm">
                  {perfil.updated_at
                    ? new Date(perfil.updated_at).toLocaleString("es")
                    : "—"}
                </div>
              </div>
            </div>
          )}

          {tab === "roles" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Roles actuales */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="size-4 text-emerald-400" />
                  <h3 className="font-semibold">Roles Asignados</h3>
                  <Badge variant="success">{rolesActuales.length}</Badge>
                </div>

                {rolesActuales.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
                    <Shield className="mx-auto size-8 text-neutral-600" />
                    <p className="mt-2 text-sm text-neutral-400">Sin roles asignados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rolesActuales.map((r) => (
                      <div
                        key={r}
                        className="group flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-purple-500/20 p-1.5">
                            <Shield className="size-4 text-purple-400" />
                          </div>
                          <span className="font-medium">{r}</span>
                        </div>
                        <button
                          onClick={() => onQuitar(r)}
                          className="rounded-lg p-2 text-red-400 opacity-0 hover:bg-red-500/20 group-hover:opacity-100"
                          title="Quitar rol"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Asignar roles */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4">
                  <h3 className="mb-3 font-semibold">Asignar Nuevo Rol</h3>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Buscar roles..."
                      className="w-full rounded-lg border border-white/10 bg-neutral-900 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {filteredDisp.map((r) => {
                    const yaAsignado = rolesActuales
                      .map((x) => x.toUpperCase())
                      .includes(r.nombre.toUpperCase());

                    return (
                      <div
                        key={r.id_rol}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          yaAsignado
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`rounded-lg p-1.5 ${
                              yaAsignado ? "bg-emerald-500/20" : "bg-blue-500/20"
                            }`}
                          >
                            <Shield
                              className={`size-4 ${
                                yaAsignado ? "text-emerald-400" : "text-blue-400"
                              }`}
                            />
                          </div>
                          <span className="text-sm">{r.nombre}</span>
                        </div>

                        {yaAsignado ? (
                          <Badge variant="success">Asignado</Badge>
                        ) : (
                          <button
                            onClick={() => onAsignar(r.id_rol, r.nombre)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium hover:bg-blue-500"
                          >
                            <Plus className="size-3.5" />
                            Asignar
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {filteredDisp.length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
                      <p className="text-sm text-neutral-400">No se encontraron roles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "actividad" && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              {actLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto size-8 animate-spin text-blue-400" />
                  <p className="mt-3 text-sm text-neutral-400">Cargando actividad...</p>
                </div>
              ) : actividad.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="mx-auto size-12 text-neutral-600" />
                  <p className="mt-3 text-sm text-neutral-400">Sin actividad reciente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actividad.slice(0, 10).map((a) => (
                    <div
                      key={a.id_auditoria}
                      className="rounded-lg border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="info">{a.modulo}</Badge>
                            <Badge variant="purple">{a.accion}</Badge>
                          </div>
                          {a.detalle && (
                            <p className="mt-2 text-sm text-neutral-300">{a.detalle}</p>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {new Date(a.fecha_hora).toLocaleString("es", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      {(a.old_values || a.new_values) && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs text-neutral-400">
                            Ver cambios
                          </summary>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {a.old_values && (
                              <pre className="rounded-lg border border-white/10 bg-black/30 p-2 text-xs text-neutral-300 whitespace-pre-wrap">
                                {typeof a.old_values === "string"
                                  ? a.old_values
                                  : JSON.stringify(a.old_values, null, 2)}
                              </pre>
                            )}
                            {a.new_values && (
                              <pre className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-xs text-blue-300 whitespace-pre-wrap">
                                {typeof a.new_values === "string"
                                  ? a.new_values
                                  : JSON.stringify(a.new_values, null, 2)}
                              </pre>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
