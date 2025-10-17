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

export type Paged<T> = { 
  total: number; 
  items: T[];
  limit?: number;
  offset?: number;
};

export type UsuarioDetalle = {
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

export type ActividadItem = {
  id_auditoria: number;
  fecha_hora: string;
  modulo: string;
  accion: string;
  detalle?: string | null;
  old_values?: string | null;
  new_values?: string | null;
};

export type RolItem = { 
  id_rol: number; 
  nombre: string; 
  descripcion?: string | null; 
  activo: boolean;
};

/** ===== Parámetros de búsqueda ===== */
export type ListAdminUsuariosParams = {
  q?: string | null;
  activo?: boolean | null;
  rol?: string | number | null;
  verificado?: boolean | null;
  fecha_alta_from?: string | null;
  fecha_alta_to?: string | null;
  sort?: "fecha_alta" | "nombre" | "correo" | "ultimo_login" | "actualizado";
  dir?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

/** ===== API Calls ===== */

// Listar usuarios con filtros y paginación
export async function listAdminUsuarios(
  params: ListAdminUsuariosParams = {}
): Promise<Paged<AdminUsuario>> {
  const { data } = await api.get<Paged<AdminUsuario>>("/admin/usuarios", { params });
  return data;
}

// Obtener detalle de un usuario
export async function getUsuarioDetalle(id_usuario: number): Promise<UsuarioDetalle> {
  const { data } = await api.get<UsuarioDetalle>(`/admin/usuarios/${id_usuario}`);
  return data;
}

// Cambiar estado activo/inactivo
export async function patchEstadoUsuario(
  id_usuario: number, 
  estado_activo: boolean
) {
  const { data } = await api.patch(`/admin/usuarios/${id_usuario}/estado`, { 
    estado_activo 
  });
  return data as { id: number; estado_activo: boolean; actualizado: string };
}

// Resetear contraseña
export async function resetearPasswordUsuario(
  id_usuario: number, 
  motivo: string
) {
  const { data } = await api.post(`/admin/usuarios/${id_usuario}/resetear-password`, { 
    motivo 
  });
  return data as {
    id: number;
    reset_ok: boolean;
    requires_password_change: boolean;
    mensaje: string;
  };
}

// Obtener actividad/auditoría de un usuario
export async function getActividadUsuario(
  id_usuario: number,
  params?: {
    modulo?: string | null;
    accion?: string | null;
    fecha_from?: string | null;
    fecha_to?: string | null;
    include_values?: boolean;
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

// Listar roles disponibles
export async function listarRolesDisponibles(): Promise<RolItem[]> {
  const { data } = await api.get<RolItem[]>("/roles", { 
    params: { activo: true, limit: 100 } 
  });
  return data ?? [];
}

// ✅ FUNCIÓN CORREGIDA - Listar roles de un usuario específico
export async function listarRolesDeUsuario(id_usuario: number): Promise<string[]> {
  try {
    const { data } = await api.get(`/admin/usuarios/${id_usuario}/roles`);
    
    // Manejo explícito de los diferentes formatos de respuesta
    if (Array.isArray(data)) {
      return data.map(r => String(r));
    }
    
    // Si viene como objeto con propiedad roles
    if (data && typeof data === 'object' && 'roles' in data) {
      const roles = (data as { roles: unknown }).roles;
      if (Array.isArray(roles)) {
        return roles.map(r => String(r));
      }
    }
    
    // Si no hay datos válidos
    return [];
  } catch (error) {
    console.error('Error al listar roles del usuario:', error);
    return [];
  }
}

// Asignar rol a usuario
export async function asignarRolAUsuario(
  id_usuario: number, 
  id_rol: number
): Promise<void> {
  await api.post(`/admin/usuarios/${id_usuario}/roles/${id_rol}`);
}

// Quitar rol de usuario
export async function quitarRolDeUsuario(
  id_usuario: number, 
  id_rol: number
): Promise<void> {
  await api.delete(`/admin/usuarios/${id_usuario}/roles/${id_rol}`);
}