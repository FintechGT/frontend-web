// src/hooks/usePermiso.ts
"use client";

import { useAuth } from "@/app/AppLayoutClient";

type Input =
  | string
  | string[]
  | { permisos?: string[]; roles?: string[] };

/**
 * Verifica permisos (useAuth().can) y opcionalmente roles
 * (roles se leen de localStorage["roles"], que puedes llenar con primeAuthCapabilitiesCache).
 */
export function usePermiso(input: Input): boolean {
  const { can } = useAuth();

  let permisos: string[] = [];
  let roles: string[] = [];

  if (typeof input === "string") permisos = [input];
  else if (Array.isArray(input)) permisos = input;
  else if (input && typeof input === "object") {
    permisos = input.permisos ?? [];
    roles = input.roles ?? [];
  }

  // 1) Permisos
  const passPerm =
    permisos.length === 0 ? true : permisos.some((p) => !!can(p));

  // 2) Roles (desde localStorage, si los tienes cacheados)
  let passRol = true;
  if (roles.length > 0 && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("roles");
      const mine = raw ? (JSON.parse(raw) as string[]) : [];
      const mineUpper = mine.map((r) => r.toUpperCase());
      passRol = roles.some((r) => mineUpper.includes(r.toUpperCase()));
    } catch {
      passRol = false;
    }
  }

  return passPerm && passRol;
}
