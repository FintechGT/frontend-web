"use client";

import * as React from "react";
import {
  listarRolesDisponibles,
  listarRolesDeUsuario,
  asignarRolAUsuario,
  quitarRolDeUsuario,
  type RolItem,
} from "@/app/services/adminUsuarios";
import Badge from "@/components/ui/Badge";
import {
  Loader2,
  Search,
  Plus,
  Trash2,
  Shield,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

/* ================= Helpers ================= */
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (
    typeof e === "object" &&
    e &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    return (e as { message: string }).message;
  }
  return "Error desconocido";
}

/* ================= Types ================= */
type Props = {
  open: boolean;
  onClose: () => void;
  userId: number | null;
  userName?: string;
  userEmail?: string;
  onChanged?: () => void | Promise<void>;
};

/* ================ Component ================ */
export default function UsuarioRolesModal({
  open,
  onClose,
  userId,
  userName,
  userEmail,
  onChanged,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [rolesActuales, setRolesActuales] = React.useState<string[]>([]);
  const [rolesDisp, setRolesDisp] = React.useState<RolItem[]>([]);
  const [filter, setFilter] = React.useState("");

  const filteredDisp = React.useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rolesDisp;
    return rolesDisp.filter(
      (r) =>
        r.nombre.toLowerCase().includes(f) ||
        (r.descripcion?.toLowerCase().includes(f) ?? false),
    );
  }, [filter, rolesDisp]);

  const load = React.useCallback(async (): Promise<void> => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const [ract, rdisp] = await Promise.all([
        listarRolesDeUsuario(userId),
        listarRolesDisponibles(),
      ]);
      setRolesActuales(Array.isArray(ract) ? ract : []);
      setRolesDisp(Array.isArray(rdisp) ? rdisp : []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      toast.error("Error al cargar roles");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    if (open && userId) {
      void load();
      setFilter("");
    }
  }, [open, userId, load]);

  const handleAsignar = React.useCallback(
    async (id_rol: number, nombre: string): Promise<void> => {
      if (!userId) return;
      try {
        setBusy(true);
        await asignarRolAUsuario(userId, id_rol);
        await load();
        if (onChanged) await onChanged();
        toast.success(`Rol "${nombre}" asignado correctamente`);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err) || "No se pudo asignar el rol");
      } finally {
        setBusy(false);
      }
    },
    [userId, load, onChanged],
  );

  const handleQuitar = React.useCallback(
    async (rolNombre: string): Promise<void> => {
      if (!userId) return;
      if (!confirm(`¿Seguro que deseas quitar el rol "${rolNombre}"?`)) return;

      const rol = rolesDisp.find(
        (r) => r.nombre.toUpperCase() === rolNombre.toUpperCase(),
      );
      if (!rol) {
        toast.error("No se encontró el rol en el catálogo");
        return;
      }

      try {
        setBusy(true);
        await quitarRolDeUsuario(userId, rol.id_rol);
        await load();
        if (onChanged) await onChanged();
        toast.success(`Rol "${rolNombre}" removido correctamente`);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err) || "No se pudo quitar el rol");
      } finally {
        setBusy(false);
      }
    },
    [userId, rolesDisp, load, onChanged],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-2">
              <Shield className="size-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Gestión de Roles</h2>
              <p className="text-sm text-neutral-400">
                {userName} {userEmail && `· ${userEmail}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="mx-auto size-8 animate-spin text-purple-400" />
                <p className="mt-3 text-sm text-neutral-400">Cargando roles...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-red-400" />
                <div>
                  <div className="font-medium text-red-400">Error</div>
                  <div className="text-sm text-red-300">{error}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Roles Asignados */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <h3 className="font-medium">Roles Asignados</h3>
                  </div>
                  <Badge variant="success">{rolesActuales.length}</Badge>
                </div>

                {rolesActuales.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
                    <Shield className="mx-auto size-8 text-neutral-600" />
                    <p className="mt-2 text-sm text-neutral-400">Sin roles asignados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rolesActuales.map((r) => {
                      const rolInfo = rolesDisp.find(
                        (rd) => rd.nombre.toUpperCase() === r.toUpperCase(),
                      );
                      return (
                        <div
                          key={r}
                          className="group flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3 transition hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-purple-500/20 p-1.5">
                              <Shield className="size-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="font-medium">{r}</div>
                              {rolInfo?.descripcion && (
                                <div className="text-xs text-neutral-400">
                                  {rolInfo.descripcion}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            disabled={busy}
                            onClick={() => void handleQuitar(r)}
                            className="rounded-lg p-2 text-red-400 opacity-0 transition hover:bg-red-500/20 group-hover:opacity-100 disabled:opacity-50"
                            title="Quitar rol"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Asignar Nuevos Roles */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Plus className="size-4 text-blue-400" />
                    <h3 className="font-medium">Asignar Nuevo Rol</h3>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Buscar roles disponibles..."
                      className="w-full rounded-lg border border-white/10 bg-neutral-900 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="max-h-[400px] space-y-2 overflow-y-auto">
                  {filteredDisp.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
                      <Search className="mx-auto size-8 text-neutral-600" />
                      <p className="mt-2 text-sm text-neutral-400">
                        {filter ? "No se encontraron roles" : "No hay roles disponibles"}
                      </p>
                    </div>
                  ) : (
                    filteredDisp.map((r) => {
                      const yaAsignado = rolesActuales
                        .map((x) => x.toUpperCase())
                        .includes(r.nombre.toUpperCase());

                      return (
                        <div
                          key={r.id_rol}
                          className={`flex items-center justify-between rounded-lg border p-3 transition ${
                            yaAsignado
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-white/10 bg-black/20 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
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
                            <div>
                              <div className="font-medium">{r.nombre}</div>
                              {r.descripcion && (
                                <div className="text-xs text-neutral-400">{r.descripcion}</div>
                              )}
                            </div>
                          </div>

                          {yaAsignado ? (
                            <Badge variant="success">
                              <CheckCircle2 className="size-3" />
                              Asignado
                            </Badge>
                          ) : (
                            <button
                              disabled={busy}
                              onClick={() => void handleAsignar(r.id_rol, r.nombre)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                            >
                              <Plus className="size-3.5" />
                              Asignar
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 p-6">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
