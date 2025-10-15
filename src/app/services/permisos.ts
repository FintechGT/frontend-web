// src/app/services/permisos.ts
import api from "@/lib/api";

export type MisPermisosResponse = {
  permisos: string[]; // ["solicitudes.create", "pagos.view", ...]
  origen?: Record<string, number[]>; // opcional, para debug
};

/**
 * Obtiene los permisos efectivos del usuario autenticado
 */
export async function getMisPermisos(): Promise<string[]> {
  try {
    const { data } = await api.get<MisPermisosResponse>("/usuarios/me/permisos");
    return data.permisos || [];
  } catch {
    return [];
  }
}