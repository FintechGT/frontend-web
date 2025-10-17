// src/app/services/seguridad.ts
import api from "@/lib/api";

/* ============================
 * Catálogos de Seguridad (CRUD)
 * ============================ */
export type Rol = {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
};

export const listRoles = async (params?: {
  q?: string;
  activo?: boolean;
  limit?: number;
  offset?: number;
}) => (await api.get("/roles", { params })).data ?? [];

export const createRol = async (p: Omit<Rol, "id_rol">) =>
  (await api.post("/roles", p)).data;

export const updateRol = async (id: number, p: Partial<Omit<Rol, "id_rol">>) =>
  (await api.patch(`/roles/${id}`, p)).data;

export const deleteRol = async (id: number) => {
  await api.delete(`/roles/${id}`);
};

export type Permiso = {
  id_permiso: number;
  id_modulo: number;
  id_accion: number;
  codigo: string; // ej: "solicitudes.admin"
  descripcion?: string | null;
  activo: boolean;
};

export const listPermisos = async (params?: { id_modulo?: number }) =>
  (await api.get("/permisos", { params })).data ?? [];

export const createPermiso = async (p: Omit<Permiso, "id_permiso">) =>
  (await api.post("/permisos", p)).data;

export const createPermisosBulk = async (p: {
  id_modulo: number;
  items: Array<Omit<Permiso, "id_permiso" | "id_modulo">>;
}) => (await api.post("/permisos/bulk", p)).data;

export const deletePermiso = async (id: number) => {
  await api.delete(`/permisos/${id}`);
};

export const deletePermisosPorModulo = async (id_modulo: number) => {
  await api.delete(`/permisos/modulo/${id_modulo}`);
};

export type Modulo = {
  id_modulo: number;
  nombre: string;
  descripcion?: string | null;
  ruta?: string | null;
  activo: boolean;
};

export const listModulos = async (params?: { activo?: boolean }) =>
  (await api.get("/modulos", { params })).data ?? [];

export const createModulo = async (p: Omit<Modulo, "id_modulo">) =>
  (await api.post("/modulos", p)).data;

export const updateModulo = async (
  id: number,
  p: Partial<Omit<Modulo, "id_modulo">>
) => (await api.patch(`/modulos/${id}`, p)).data;

export const deleteModulo = async (id: number) => {
  await api.delete(`/modulos/${id}`);
};

export const listPermisosDeRol = async (id_rol: number) =>
  (await api.get(`/roles/${id_rol}/permisos`)).data ?? [];

export const asignarPermisosARol = async (
  id_rol: number,
  items: Array<{ id_permiso: number; otorgado: boolean }>
) => (await api.post(`/roles/${id_rol}/permisos`, { items })).data;

export const quitarPermisoDeRol = async (id_rol: number, id_permiso: number) => {
  await api.delete(`/roles/${id_rol}/permisos/${id_permiso}`);
};

/* ============================
 * Capacidades del usuario
 * (roles / permisos del usuario logueado)
 * ============================ */

/** Intenta obtener los roles del usuario actual (en MAYÚSCULAS). */
export async function getMisRoles(): Promise<string[]> {
  // Ajusta la ruta si tu backend usa otra (por ejemplo /seguridad/mis-roles)
  const r = await api.get("/seguridad/mis-roles").catch(() => null);
  const data = r?.data;
  const roles = Array.isArray(data) ? data : data?.roles;
  return Array.isArray(roles)
    ? roles.map((x) => String(x).toUpperCase())
    : [];
}

/** Intenta obtener los permisos del usuario actual (códigos). */
export async function getMisPermisos(): Promise<string[]> {
  // Ajusta la ruta si tu backend usa otra (por ejemplo /seguridad/mis-permisos)
  const r = await api.get("/seguridad/mis-permisos").catch(() => null);
  const data = r?.data;
  const permisos = Array.isArray(data) ? data : data?.permisos;
  return Array.isArray(permisos) ? permisos.map((x) => String(x)) : [];
}

/** Guarda roles/permisos en localStorage para checks sincrónicos en el cliente. */
export async function primeAuthCapabilitiesCache(): Promise<void> {
  const [roles, permisos] = await Promise.all([getMisRoles(), getMisPermisos()]);
  if (typeof window !== "undefined") {
    localStorage.setItem("roles", JSON.stringify(roles)); // ["ADMINISTRADOR",...]
    localStorage.setItem("permisos_codigos", JSON.stringify(permisos)); // ["solicitudes.admin",...]
  }
}

/** Fallback pragmático: verifica si el usuario puede acceder al módulo admin de solicitudes. */
export async function esAdminSolicitudes(): Promise<boolean> {
  try {
    await api.get("/admin/solicitudes", { params: { limit: 1, offset: 0 } });
    return true;
  } catch (e: any) {
    const msg = e?.message?.toLowerCase?.() ?? "";
    if (msg.includes("403") || msg.includes("401") || msg.includes("forbidden") || msg.includes("unauthorized")) {
      return false;
    }
    // otro error (red/CORS), propaga para que lo veas
    throw e;
  }
}
