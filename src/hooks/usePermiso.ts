// src/hooks/usePermiso.ts
import { useAuth } from "@/app/AppLayoutClient";

export function usePermiso(permiso: string | string[]): boolean {
  const { can } = useAuth();
  const permisos = Array.isArray(permiso) ? permiso : [permiso];
  return permisos.some(p => can(p));
}