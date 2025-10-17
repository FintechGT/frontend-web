// src/hooks/useEsAdmin.ts
"use client";

import * as React from "react";
import api from "@/lib/api";

/** Lee roles del usuario (ajusta la ruta si tu backend usa otra). */
async function getMisRoles(): Promise<string[]> {
  try {
    const r = await api.get("/seguridad/mis-roles");
    const data = r.data;
    const roles = Array.isArray(data) ? data : data?.roles;
    return Array.isArray(roles) ? roles.map((x) => String(x).toUpperCase()) : [];
  } catch {
    return [];
  }
}

/** Lee permisos del usuario (ajusta la ruta si tu backend usa otra). */
async function getMisPermisos(): Promise<string[]> {
  try {
    const r = await api.get("/seguridad/mis-permisos");
    const data = r.data;
    const permisos = Array.isArray(data) ? data : data?.permisos;
    return Array.isArray(permisos) ? permisos.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

/**
 * Determina si el usuario es “admin” para Solicitudes:
 *  1) Por roles: ADMINISTRADOR / SUPERVISOR / VALUADOR
 *  2) Por permisos: alguno de los códigos admin
 *  3) Fallback: ping GET /admin/solicitudes?limit=1 (200 => admin; 401/403 => no)
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
        if (roles.some((r) => ["ADMINISTRADOR", "SUPERVISOR", "VALUADOR"].includes(r))) {
          if (!alive) return;
          setEsAdmin(true);
          setChecking(false);
          return;
        }

        // 2) Permisos (ajusta códigos a tu ACL real)
        const permisos = await getMisPermisos();
        const permsAdmin = [
          "solicitudes.admin",
          "solicitudes.listar_todas",
          "solicitudes.aprobar",
          "solicitudes.rechazar",
        ];
        if (permisos.some((p) => permsAdmin.includes(p))) {
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
      } catch (e: any) {
        const msg = String(e?.message || "").toLowerCase();
        if (msg.includes("401") || msg.includes("403") || msg.includes("unauthorized") || msg.includes("forbidden")) {
          setEsAdmin(false);
          setChecking(false);
        } else {
          setError(e?.message ?? "Error al verificar permisos");
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
