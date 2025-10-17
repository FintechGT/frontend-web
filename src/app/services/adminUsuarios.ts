// src/app/services/adminUsuarios.ts
import api from "@/lib/api";

/** ===== Tipos base ===== */
export type AdminUsuario = {
  id: number;
  nombre: string;
  correo: string;
  estado_activo: boolean;
  roles: string[];
  ultimo_login?: string | null;
  fecha_alta?: string | null;
  actualizado?: string | null;
};

export type Paged<T> = { total: number; items: T[] };

/** ===== Listado ===== */
export type ListAdminUsuariosParams = {
  q?: string | null;
  activo?: boolean | null;
  rol?: string | number | null;
  verificado?: boolean | null;
  fecha_alta_from?: string | null; // YYYY-MM-DD
  fecha_alta_to?: string | null;   // YYYY-MM-DD
  sort?: "fecha_alta" | "nombre" | "correo" | "ultimo_login" | "actualizado";
  dir?: "asc" | "desc";
  limit?: number;  // 1..200
  offset?: number; // >= 0
};

export async function listAdminUsuarios(params: ListAdminUsuariosParams = {}): Promise<Paged<AdminUsuario>> {
  const { data } = await api.get<Paged<AdminUsuario>>("/admin/usuarios", { params });
  return data;
}

/** ===== Activar / Desactivar ===== */
export async function patchEstadoUsuario(id_usuario: number, estado_activo: boolean) {
  const { data } = await api.patch(`/admin/usuarios/${id_usuario}/estado`, { estado_activo });
  return data as { id: number; estado_activo: boolean; actualizado: string };
}

/** ===== Resetear password ===== */
export async function resetearPasswordUsuario(id_usuario: number, motivo: string) {
  const { data } = await api.post(`/admin/usuarios/${id_usuario}/resetear-password`, { motivo });
  return data as {
    id: number;
    reset_ok: boolean;
    requires_password_change: boolean;
    mensaje: string;
  };
}

/** ===== Actividad (auditoría) ===== */
export type ActividadItem = {
  id_auditoria: number;
  fecha_hora: string;
  modulo: string;
  accion: string;
  detalle?: string | null;
  old_values?: string | null;
  new_values?: string | null;
};

export async function getActividadUsuario(
  id_usuario: number,
  params?: {
    modulo?: string | null;
    accion?: string | null;
    fecha_from?: string | null; // YYYY-MM-DD
    fecha_to?: string | null;   // YYYY-MM-DD
    include_values?: boolean;   // default true
    limit?: number;
    offset?: number;
  }
) {
  const { data } = await api.get(`/admin/usuarios/${id_usuario}/actividad`, { params });
  return data as {
    usuario: { id: number; nombre: string; correo: string; roles: string[] };
    total: number;
    items: ActividadItem[];
  };
}

/** ===== Detalle de usuario (perfil) =====
 * Si tu backend ya tiene /usuarios/{id}, úsalo; si no, el router de admin_usuarios también puede exponerlo.
 */
export async function getUsuarioDetalle(id_usuario: number) {
  // Ajusta la ruta a la que tengas disponible:
  // - Opción A (preferida): /usuarios/{id}
  // - Opción B (router admin_usuarios): /admin/usuarios/{id}
  const { data } = await api.get(`/usuarios/${id_usuario}`);
  return data as {
    id: number;
    nombre: string;
    correo: string;
    telefono?: string | null;
    direccion?: string | null;
    verificado?: boolean;
    estado_activo: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  };
}

/** ===== Roles ===== */
export type RolItem = { id_rol: number; nombre: string; descripcion?: string | null; activo: boolean };

export async function listarRolesDisponibles(): Promise<RolItem[]> {
  const { data } = await api.get<RolItem[]>("/roles", { params: { activo: true } });
  return data ?? [];
}

export async function listarRolesDeUsuario(id_usuario: number): Promise<string[]> {
  const { data } = await api.get<string[]>(`/usuarios/${id_usuario}/roles`);
  // Puede venir como { roles: [...] } según tu backend. Normalizamos:
  if (Array.isArray(data)) return data;
  if (data?.roles && Array.isArray(data.roles)) return data.roles;
  return [];
}

export async function asignarRolAUsuario(id_usuario: number, id_rol: number) {
  // Algunas APIs usan POST /usuarios/{id}/roles con body {id_rol}
  await api.post(`/usuarios/${id_usuario}/roles`, { id_rol });
}

export async function quitarRolDeUsuario(id_usuario: number, id_rol: number) {
  // Algunas APIs usan DELETE /usuarios/{id}/roles/{id_rol}
  await api.delete(`/usuarios/${id_usuario}/roles/${id_rol}`);
}
