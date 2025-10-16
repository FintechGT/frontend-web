"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/app/AppLayoutClient";

type Props = {
  permiso: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function ProtectedPage({ permiso, children, fallback }: Props) {
  const { loading, can } = useAuth();
  const permisos = Array.isArray(permiso) ? permiso : [permiso];
  const permitido = permisos.some((p) => can(p));

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
          Cargando permisos…
        </div>
      </div>
    );
  }

  if (!permitido) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-400" />
            <div>
              <div className="font-medium text-red-400">Acceso denegado</div>
              <div className="mt-1 text-sm text-red-300">
                No tienes permisos para ver esta sección. Contacta al administrador.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
