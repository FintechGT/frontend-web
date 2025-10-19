// src/hooks/usePermiso.ts
"use client";

import * as React from "react";
import { useAuth } from "@/app/AppLayoutClient";

export function usePermiso(
  input: string | string[] | { permisos?: string[]; roles?: string[] }
): boolean {
  const { user, permisos, roles, loading } = useAuth();

  // Mientras carga, no permitir acceso
  if (loading) {
    console.log("🔄 usePermiso: Cargando permisos...");
    return false;
  }

  // Si no hay usuario, no tiene permisos
  if (!user) {
    console.log("❌ usePermiso: Sin usuario autenticado");
    return false;
  }

  // Normalizar entrada
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

  // Debug: Mostrar en consola qué se está verificando
  console.log("🔍 usePermiso verificando:", {
    permisosRequeridos,
    rolesRequeridos,
    permisosUsuario: permisos,
    rolesUsuario: roles
  });

  // Verificar permisos
  const tienePermiso = permisosRequeridos.length === 0
    ? true
    : permisosRequeridos.some((p) =>
        (permisos ?? []).some(
          (mine) => mine.toLowerCase() === p.toLowerCase()
        )
      );

  // Verificar roles
  const tieneRol = rolesRequeridos.length === 0
    ? true
    : rolesRequeridos.some((r) =>
        (roles ?? []).some(
          (mine) => mine.toUpperCase() === r.toUpperCase()
        )
      );

  const resultado = tienePermiso && tieneRol;
  
  console.log(`✅ usePermiso resultado:`, resultado);
  
  return resultado;
}