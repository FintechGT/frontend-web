//src/app/(app)/dashboard/solicitudes/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import AdminSolicitudesPage from "./AdminSolicitudes";
import MisSolicitudesPage from "./MisSolicitudes";
import { usePermiso } from "@/hooks/usePermiso";
import { useAuth } from "@/app/AppLayoutClient";
import { RotateCw, AlertCircle } from "lucide-react";

export default function PageSolicitudes() {
  const router = useRouter();
  const { roles, loading } = useAuth();
  const [checking, setChecking] = React.useState(true);
  
  // ✅ Verificar si tiene permisos de ADMIN
  const tienePermisoAdmin = usePermiso([
    "ADMIN_SOLICITUDES_LISTAR",
    "solicitudes.listar_todas",
    "admin.solicitudes"
  ]);
  
  // ✅ Verificar si tiene rol de ADMIN
  const esRolAdmin = roles.some(r => 
    ["ADMINISTRADOR", "SUPERVISOR", "VALUADOR"].includes(r.toUpperCase())
  );
  
  // ✅ Es admin si tiene el permiso O el rol
  const esAdmin = tienePermisoAdmin || esRolAdmin;
  
  // ✅ Verificar permiso básico de ver solicitudes
  const puedeVer = usePermiso("solicitudes.view");

  React.useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Mientras carga
  if (loading || checking) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-400">
        <RotateCw className="mr-2 size-6 animate-spin" />
        Verificando permisos…
      </div>
    );
  }

  // Si no tiene permiso de ver solicitudes
  if (!puedeVer) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-400" />
            <div>
              <div className="font-medium text-red-400">Acceso denegado</div>
              <div className="mt-1 text-sm text-red-300">
                No tienes permiso para ver solicitudes. Contacta al administrador.
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

  // Mostrar vista según permisos/roles
  console.log("🔍 Verificación de admin:", {
    tienePermisoAdmin,
    esRolAdmin,
    esAdmin,
    roles
  });

  return esAdmin ? <AdminSolicitudesPage /> : <MisSolicitudesPage />;
}