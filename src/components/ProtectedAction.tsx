// src/components/ProtectedAction.tsx
"use client";

import { useAuth } from "@/app/AppLayoutClient";
import { ReactNode } from "react";

type Props = {
  permiso: string | string[]; // "solicitudes.create" o ["solicitudes.create", "solicitudes.update"]
  fallback?: ReactNode; // Qué mostrar si no tiene permiso
  children: ReactNode;
};

/**
 * Renderiza children solo si el usuario tiene el/los permiso(s)
 */
export default function ProtectedAction({ permiso, fallback = null, children }: Props) {
  const { can } = useAuth();

  const permisos = Array.isArray(permiso) ? permiso : [permiso];
  const tienePermiso = permisos.some(p => can(p));

  if (!tienePermiso) return <>{fallback}</>;
  return <>{children}</>;
}