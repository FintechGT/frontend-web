// src/app/services/seguridad.ts
import api from "@/lib/api";

export type Rol = { id_rol: number; nombre: string; descripcion?: string | null; activo: boolean };
export const listRoles = async (params?: { q?: string; activo?: boolean; limit?: number; offset?: number }) =>
  (await api.get("/roles", { params })).data ?? [];
export const createRol   = async (p: Omit<Rol,"id_rol">) => (await api.post("/roles", p)).data;
export const updateRol   = async (id: number, p: Partial<Omit<Rol,"id_rol">>) => (await api.patch(`/roles/${id}`, p)).data;
export const deleteRol   = async (id: number) => { await api.delete(`/roles/${id}`); };

export type Permiso = { id_permiso: number; id_modulo: number; id_accion: number; codigo: string; descripcion?: string|null; activo: boolean };
export const listPermisos = async (params?: { id_modulo?: number }) =>
  (await api.get("/permisos", { params })).data ?? [];
export const createPermiso = async (p: Omit<Permiso,"id_permiso">) => (await api.post("/permisos", p)).data;
export const createPermisosBulk = async (p: { id_modulo: number; items: Array<Omit<Permiso,"id_permiso"|"id_modulo">> }) =>
  (await api.post("/permisos/bulk", p)).data;
export const deletePermiso = async (id: number) => { await api.delete(`/permisos/${id}`); };
export const deletePermisosPorModulo = async (id_modulo: number) => { await api.delete(`/permisos/modulo/${id_modulo}`); };

export type Modulo = { id_modulo: number; nombre: string; descripcion?: string|null; ruta?: string|null; activo: boolean };
export const listModulos = async (params?: { activo?: boolean }) => (await api.get("/modulos", { params })).data ?? [];
export const createModulo = async (p: Omit<Modulo,"id_modulo">) => (await api.post("/modulos", p)).data;
export const updateModulo = async (id: number, p: Partial<Omit<Modulo,"id_modulo">>) => (await api.patch(`/modulos/${id}`, p)).data;
export const deleteModulo = async (id: number) => { await api.delete(`/modulos/${id}`); };

export const listPermisosDeRol   = async (id_rol: number) => (await api.get(`/roles/${id_rol}/permisos`)).data ?? [];
export const asignarPermisosARol = async (id_rol: number, items: Array<{ id_permiso: number; otorgado: boolean }>) =>
  (await api.post(`/roles/${id_rol}/permisos`, { items })).data;
export const quitarPermisoDeRol  = async (id_rol: number, id_permiso: number) => { await api.delete(`/roles/${id_rol}/permisos/${id_permiso}`); };
