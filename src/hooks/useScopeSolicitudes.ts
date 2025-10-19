// src/hooks/useScopeSolicitudes.ts
"use client";

import { usePermiso } from "@/hooks/usePermiso";
import { useEsAdmin } from "@/hooks/useEsAdmin";

/* =========================================================================
   Tipos exportados
   -------------------------------------------------------------------------
   - ScopeSolicitudes define el alcance de visibilidad de solicitudes.
   - UseScopeResult representa el retorno estructurado del hook.
   ========================================================================= */
export type ScopeSolicitudes = "all" | "mine" | "none";

type UseScopeResult = {
  scope: ScopeSolicitudes;
  checking: boolean;
  error: string | null;
};

/* =========================================================================
   Hook: useScopeSolicitudes
   -------------------------------------------------------------------------
   - Determina el alcance de solicitudes que un usuario puede ver.
   - Se asegura que todos los hooks se llamen en el mismo orden, evitando
     el error de "React Hook called conditionally".
   - Flujo:
       1. Obtiene si el usuario es admin (useEsAdmin).
       2. Evalúa permisos básicos (usePermiso) *sin condicionales*.
       3. Devuelve el alcance según prioridad.
   ========================================================================= */
export function useScopeSolicitudes(): UseScopeResult {
  // 1️⃣ Evalúa si el usuario es administrador
  const { checking, esAdmin, error } = useEsAdmin();

  // 2️⃣ Evalúa permisos del usuario (sin condicional)
  const canViewMine = usePermiso({
    permisos: ["solicitudes.view", "solicitudes.create"],
  });

  // 3️⃣ Determina alcance final basado en las reglas establecidas
  if (checking) {
    return { scope: "none", checking: true, error: null };
  }

  if (esAdmin) {
    return { scope: "all", checking: false, error };
  }

  if (canViewMine) {
    return { scope: "mine", checking: false, error };
  }

  return { scope: "none", checking: false, error };
}
