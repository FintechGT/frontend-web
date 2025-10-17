"use client";

import * as React from "react";
import {
  listarRolesDisponibles,
  listarRolesDeUsuario,
  asignarRolAUsuario,
  quitarRolDeUsuario,
  type RolItem,
} from "@/app/services/adminUsuarios";
import { Loader2, Search, Plus, Trash2, Shield } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: number | null;
  userName?: string;
  userEmail?: string;
  /** opcional: callback para refrescar lista padre después de cambios */
  onChanged?: () => void | Promise<void>;
};

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

  const [rolesActuales, setRolesActuales] = React.useState<string[]>([]);
  const [rolesDisp, setRolesDisp] = React.useState<RolItem[]>([]);
  const [filter, setFilter] = React.useState("");

  const [busy, setBusy] = React.useState(false);

  const filteredDisp = React.useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rolesDisp;
    return rolesDisp.filter((r) => r.nombre.toLowerCase().includes(f));
  }, [filter, rolesDisp]);

  async function load() {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const [ract, rdisp] = await Promise.all([
        listarRolesDeUsuario(userId),
        listarRolesDisponibles(),
      ]);
      setRolesActuales(ract ?? []);
      setRolesDisp(rdisp ?? []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar roles");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (open && userId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  async function handleAsignar(id_rol: number) {
    if (!userId) return;
    try {
      setBusy(true);
      await asignarRolAUsuario(userId, id_rol);
      await load();
      if (onChanged) await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleQuitar(rolNombre: string) {
    if (!userId) return;
    const rol = rolesDisp.find((r) => r.nombre.toUpperCase() === rolNombre.toUpperCase());
    if (!rol) {
      alert("No se encontró el rol en el catálogo");
      return;
    }
    try {
      setBusy(true);
      await quitarRolDeUsuario(userId, rol.id_rol);
      await load();
      if (onChanged) await onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full sm:max-w-2xl sm:rounded-2xl sm:border sm:border-white/10 sm:bg-black/70 backdrop-blur p-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="size-5" />
              <h2 className="text-lg font-semibold truncate">Roles del usuario</h2>
            </div>
            <div className="text-sm text-neutral-400 truncate">
              {userName} {userEmail ? `· ${userEmail}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Cerrar
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="mt-4 text-neutral-300 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Cargando…
          </div>
        ) : error ? (
          <div className="mt-4 rounded border border-rose-500/30 bg-rose-500/10 p-3 text-rose-200 text-sm">
            {error}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Roles actuales */}
            <div className="rounded-xl border border-white/10 p-4">
              <div className="text-sm font-medium mb-2">Asignados</div>
              <div className="flex flex-wrap gap-2">
                {rolesActuales.length ? (
                  rolesActuales.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs"
                    >
                      {r}
                      <button
                        disabled={busy}
                        onClick={() => handleQuitar(r)}
                        className="ml-1 hover:text-rose-400 disabled:opacity-50"
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
              <div className="text-sm font-medium">Asignar nuevo rol</div>
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
                    const ya = rolesActuales.map((x) => x.toUpperCase()).includes(r.nombre.toUpperCase());
                    return (
                      <li key={r.id_rol} className="flex items-center justify-between p-2 text-sm">
                        <div>{r.nombre}</div>
                        <button
                          disabled={ya || busy}
                          onClick={() => handleAsignar(r.id_rol)}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
                            ya || busy
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
          </div>
        )}
      </div>
    </div>
  );
}
