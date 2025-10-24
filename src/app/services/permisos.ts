// src/app/services/permisos.ts
import api from "@/lib/api";

export type MisPermisosResponse = {
  permisos: string[]; // ["solicitudes.create", "pagos.view", ...]
  origen?: Record<string, number[]>; // opcional, para debug
};

/**
 * Obtiene los permisos del usuario autenticado.
 * Si ocurre un error (ej. token inválido, red), devuelve un array vacío.
 */
export async function getMisPermisos(): Promise<string[]> {
  try {
    const { data } = await api.get<MisPermisosResponse>("/usuarios/me/permisos");
    return Array.isArray(data.permisos) ? data.permisos : [];
  } catch (error: unknown) {
    // Manejo seguro sin usar `any`
    if (error && typeof error === "object") {
      const e = error as { response?: { status?: number; data?: unknown } };
      const status = e.response?.status;
      const message =
        status === 401
          ? "No autorizado"
          : status === 403
          ? "Prohibido"
          : "Error al obtener permisos";
      console.warn(message);
    }
    return [];
  }
}
