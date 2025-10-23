// src/app/(app)/dashboard/contratos/page.tsx
"use client";

import * as React from "react";
import { RotateCw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePermiso } from "@/hooks/usePermiso";
import { useAuth } from "@/app/AppLayoutClient";
import AdminContratos from "./AdminContratos";
import MisContratos from "./MisContratos";

export default function PageContratos() {
  const router = useRouter();
  const { roles, loading } = useAuth();

  // permiso granular
  const puedeVer = usePermiso(["contratos.view", "contratos.listar", "contratos.mis"]);
  // permisos/roles fuertes para admin
  const tienePermisoAdmin = usePermiso([
    "contratos.admin",
    "admin.contratos",
    "CONTRATOS_LISTAR_TODOS",
  ]);
  const esRolAdmin = roles.some((r) =>
    ["ADMINISTRADOR", "SUPERVISOR", "VALUADOR"].includes(r.toUpperCase())
  );
  const esAdmin = tienePermisoAdmin || esRolAdmin;

  const [checking, setChecking] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setChecking(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-400">
        <RotateCw className="mr-2 size-6 animate-spin" />
        Verificando permisos…
      </div>
    );
  }

  if (!puedeVer) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-400" />
            <div>
              <div className="font-medium text-red-400">Acceso denegado</div>
              <div className="mt-1 text-sm text-red-300">
                No tienes permiso para ver contratos. Contacta al administrador.
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return esAdmin ? <AdminContratos /> : <MisContratos />;
}
