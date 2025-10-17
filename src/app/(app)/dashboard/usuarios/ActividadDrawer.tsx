// src/app/(app)/dashboard/usuarios/ActividadDrawer.tsx
"use client";

import * as React from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { getActividadUsuario, type ActividadItem } from "@/app/services/adminUsuarios";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: number | null;
  userName?: string;
};

export default function ActividadDrawer({ open, onClose, userId, userName }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<ActividadItem[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !userId) return;
      try {
        setLoading(true);
        setError(null);
        const r = await getActividadUsuario(userId, { limit: 50, offset: 0, include_values: true });
        if (!alive) return;
        setItems(r.items ?? []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Error al cargar actividad");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, userId]);

  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl transform bg-neutral-950/95 backdrop-blur border-l border-white/10 transition-transform
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="font-semibold">Actividad de {userName ?? `usuario #${userId ?? "?"}`}</div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-56px)]">
          {loading && (
            <div className="text-neutral-300 flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Cargando…
            </div>
          )}

          {error && (
            <div className="text-red-400 flex items-center gap-2">
              <AlertCircle className="size-4" />
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-neutral-400 text-sm">Sin actividad reciente.</div>
          )}

          {items.map((a) => (
            <div key={a.id_auditoria} className="rounded-xl border border-white/10 p-3">
              <div className="text-xs text-neutral-400">
                {new Date(a.fecha_hora).toLocaleString()}
              </div>
              <div className="mt-1 text-sm">
                <span className="font-medium">{a.modulo}</span> — {a.accion}
              </div>
              {!!a.detalle && (
                <div className="mt-1 text-xs text-neutral-300">{a.detalle}</div>
              )}
              {(a.old_values || a.new_values) && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-neutral-300">Cambios</summary>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    <pre className="whitespace-pre-wrap break-all rounded-lg bg-black/30 p-2 border border-white/10">
                      <span className="text-neutral-400">OLD: </span>{a.old_values ?? "—"}
                    </pre>
                    <pre className="whitespace-pre-wrap break-all rounded-lg bg-black/30 p-2 border border-white/10">
                      <span className="text-neutral-400">NEW: </span>{a.new_values ?? "—"}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
