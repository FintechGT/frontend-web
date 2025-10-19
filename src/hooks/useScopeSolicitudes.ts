// src/hooks/useScopeSolicitudes.ts
"use client";

import { usePermiso } from "@/hooks/usePermiso";
import { useEsAdmin } from "@/hooks/useEsAdmin";

export type ScopeSolicitudes = "all" | "mine" | "none";

type UseScopeResult = {
  scope: ScopeSolicitudes;
  checking: boolean;
  error: string | null;
};

/**
 * Reglas:
 *  - "all": es admin real (rol ADMINISTRADOR o acceso a /admin/solicitudes)
 *  - "mine": tiene ver propias o crear
 *  - "none": nada
 */
export function useScopeSolicitudes(): UseScopeResult {
  const { checking, esAdmin, error } = useEsAdmin();

  if (checking) return { scope: "none", checking: true, error: null };
  if (esAdmin)  return { scope: "all",  checking: false, error };

  const canViewMine = usePermiso({ permisos: ["solicitudes.view", "solicitudes.create"] });
  if (canViewMine) return { scope: "mine", checking: false, error };

  return { scope: "none", checking: false, error };
}
