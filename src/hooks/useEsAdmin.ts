// src/hooks/useEsAdmin.ts
"use client";

import * as React from "react";
import api from "@/lib/api";

/** ===== Utilidades de tipos (sin any) ===== */
type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

type RolesResponse =
  | string[]
  | { roles?: unknown }
  | JsonValue;

type PermisosResponse =
  | string[]
  | { permisos?: unknown }
  | JsonValue;

type MaybeAxiosError = {
  message?: string;
  response?: { status?: number };
};

/** Helpers */
function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((i) => typeof i === "string");
}

function upperAll(xs: string[]): string[] {
  return xs.map((x) => x.toUpperCase());
}

function getStatus(err: unknown): number | null {
  const e = err as MaybeAxiosError;
  return typeof e?.response?.status === "number" ? e.response.status : null;
}

function getErrMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  const e = err as MaybeAxiosError;
  return typeof e?.message === "string" ? e.message : "Error desconocido";
}

/** Lee roles del usuario (ajusta la ruta si tu backend usa otra). */
async function getMisRoles(): Promise<string[]> {
  try {
    const r = await api.get<RolesResponse>("/seguridad/mis-roles");
    const data = r.data;
    const roles = Array.isArray(data) ? data : (data && typeof data === "object" ? (data as { roles?: unknown }).roles : undefined);
    return isStringArray(roles) ? upperAll(roles) : [];
  } catch {
    return [];
  }
}

/** Lee permisos del usuario (ajusta la ruta si tu backend usa otra). */
async function getMisPermisos(): Promise<string[]> {
  try {
    const r = await api.get<PermisosResponse>("/seguridad/mis-permisos");
    const data = r.data;
    const permisos = Array.isArray(data) ? data : (data && typeof data === "object" ? (data as { permisos?: unknown }).permisos : undefined);
    return isStringArray(permisos) ? permisos : [];
  } catch {
    return [];
  }
}

/**
 * Determina si el usuario es “admin” para Solicitudes:
 *  1) Por roles: ADMINISTRADOR / SUPERVISOR / VALUADOR
 *  2) Por permisos: alguno de los códigos admin
 *  3) Fallback: GET /admin/solicitudes?limit=1 (200 => admin; 401/403 => no)
 */
export function useEsAdmin() {
  const [checking, setChecking] = React.useState(true);
  const [esAdmin, setEsAdmin] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setChecking(true);
        setError(null);

        // 1) Roles
        const roles = await getMisRoles();
        if (roles.some((r) => r === "ADMINISTRADOR" || r === "SUPERVISOR" || r === "VALUADOR")) {
          if (!alive) return;
          setEsAdmin(true);
          setChecking(false);
          return;
        }

        // 2) Permisos (ajusta códigos a tu ACL real)
        const permisos = await getMisPermisos();
        const permsAdmin = new Set([
          "solicitudes.admin",
          "solicitudes.listar_todas",
          "solicitudes.aprobar",
          "solicitudes.rechazar",
        ]);
        if (permisos.some((p) => permsAdmin.has(p))) {
          if (!alive) return;
          setEsAdmin(true);
          setChecking(false);
          return;
        }

        // 3) Fallback a la API real
        await api.get("/admin/solicitudes", { params: { limit: 1, offset: 0 } });
        if (!alive) return;
        setEsAdmin(true);
        setChecking(false);
      } catch (e: unknown) {
        const status = getStatus(e);
        const msg = getErrMsg(e).toLowerCase();

        if (status === 401 || status === 403 || msg.includes("unauthorized") || msg.includes("forbidden")) {
          if (!alive) return;
          setEsAdmin(false);
          setChecking(false);
        } else {
          if (!alive) return;
          setError(getErrMsg(e) ?? "Error al verificar permisos");
          setChecking(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { checking, esAdmin, error };
}

export default useEsAdmin;
