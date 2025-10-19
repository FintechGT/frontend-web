// src/hooks/usePermiso.ts
"use client";

import { useAuth } from "@/app/AppLayoutClient";

/* =========================================================================
   Hook: usePermiso
   -------------------------------------------------------------------------
   - Determina si el usuario autenticado posee al menos uno de los permisos
     y/o roles requeridos.
   - Retorna `false` mientras la sesión está cargando o si no hay usuario.
   - No usa `React` directamente para evitar el warning de import no usado.
   ========================================================================= */
export function usePermiso(
  input: string | string[] | { permisos?: string[]; roles?: string[] }
): boolean {
  const { user, permisos, roles, loading } = useAuth();

  // Mientras se resuelve la autenticación, no concede acceso.
  if (loading) return false;

  // Sin usuario autenticado, no hay permisos.
  if (!user) return false;

  // Normaliza la entrada en dos listas: permisos y roles requeridos.
  let permisosRequeridos: string[] = [];
  let rolesRequeridos: string[] = [];

  if (typeof input === "string") {
    permisosRequeridos = [input];
  } else if (Array.isArray(input)) {
    permisosRequeridos = input;
  } else if (input && typeof input === "object") {
    permisosRequeridos = input.permisos ?? [];
    rolesRequeridos = input.roles ?? [];
  }

  // Normaliza a minúsculas para comparación insensible a mayúsculas.
  const minePerms = (permisos ?? []).map((p) => p.toLowerCase());
  const mineRoles = (roles ?? []).map((r) => r.toLowerCase());

  const needPerms = permisosRequeridos.map((p) => p.toLowerCase());
  const needRoles = rolesRequeridos.map((r) => r.toLowerCase());

  // Regla: si no se piden permisos, se considera que pasa esa parte.
  const tienePermiso =
    needPerms.length === 0
      ? true
      : needPerms.some((p) => minePerms.includes(p));

  // Regla: si no se piden roles, se considera que pasa esa parte.
  const tieneRol =
    needRoles.length === 0
      ? true
      : needRoles.some((r) => mineRoles.includes(r));

  return tienePermiso && tieneRol;
}
