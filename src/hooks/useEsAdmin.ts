// src/hooks/useEsAdmin.ts
"use client";

import * as React from "react";
import { usePermiso } from "./usePermiso";
import { useAuth } from "@/app/AppLayoutClient";

export function useEsAdmin() {
  const { roles, loading } = useAuth();
  const [checking, setChecking] = React.useState(true);
  
  // Verificar por PERMISOS
  const tienePermisoAdmin = usePermiso([
    "ADMIN_SOLICITUDES_LISTAR",
    "solicitudes.listar_todas",
    "admin.solicitudes"
  ]);
  
  // Verificar por ROLES
  const esRolAdmin = roles.some(r => 
    ["ADMINISTRADOR", "SUPERVISOR", "VALUADOR"].includes(r.toUpperCase())
  );
  
  // Es admin si tiene el permiso O el rol
  const esAdmin = tienePermisoAdmin || esRolAdmin;

  React.useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 300);
    return () => clearTimeout(timer);
  }, [roles, loading]);

  console.log("🔍 useEsAdmin:", {
    tienePermisoAdmin,
    esRolAdmin,
    esAdmin,
    roles
  });

  return { 
    checking: checking || loading, 
    esAdmin, 
    error: null 
  };
}

export default useEsAdmin;
