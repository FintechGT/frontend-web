"use client";

import * as React from "react";
import Link from "next/link";
import api from "@/lib/api";

type Perfil = {
  nombre: string | null;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
  verificado?: boolean;
  created_at?: string;
};

export default function PerfilPage() {
  const [me, setMe] = React.useState<Perfil | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Perfil>("/usuarios/me");
        if (alive) setMe(data);
      } catch {
        if (alive) setMe(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="animate-pulse text-sm text-neutral-400">Cargando perfil…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Tu perfil</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Datos principales de tu cuenta.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        {!me ? (
          <div className="text-sm text-red-400">No se pudo cargar tu perfil.</div>
        ) : (
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-neutral-400">Nombre</dt>
              <dd className="mt-1">{me.nombre || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-400">Correo</dt>
              <dd className="mt-1 break-all">{me.correo}</dd>
            </div>
            <div>
              <dt className="text-neutral-400">Teléfono</dt>
              <dd className="mt-1">{me.telefono || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-400">Dirección</dt>
              <dd className="mt-1">{me.direccion || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-400">Verificado</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                    me.verificado
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  {me.verificado ? "Sí" : "No"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-neutral-400">Creado</dt>
              <dd className="mt-1">
                {me.created_at
                  ? new Date(me.created_at).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-5">
          <Link
            href="/dashboard/perfil/editar"
            className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Modificar
          </Link>
        </div>
      </div>
    </div>
  );
}
