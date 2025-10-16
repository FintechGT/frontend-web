// src/app/services/adminUsuarios.ts
import api from "@/lib/api";

export type AdminUsuario = {
  id: number;
  nombre: string;
  correo: string;
  estado_activo: boolean;
  roles: string[];                 // p.ej. ["ADMIN","VALUADOR"]
  ultimo_login?: string | null;
  fecha_alta?: string | null;
  actualizado?: string | null;
};

export type ListAdminUsuariosParams = {
  q?: string | null;
  activo?: boolean | null;
  rol?: string | number | null;    // nombre o ID numérico
  verificado?: boolean | null;
  fecha_alta_from?: string | null; // YYYY-MM-DD
  fecha_alta_to?: string | null;   // YYYY-MM-DD
  sort?: "fecha_alta" | "nombre" | "correo" | "ultimo_login" | "actualizado";
  dir?: "asc" | "desc";
  limit?: number;                  // 1..200
  offset?: number;                 // >= 0
};

export type Paged<T> = { total: number; items: T[] };

export async function listAdminUsuarios(params: ListAdminUsuariosParams = {}): Promise<Paged<AdminUsuario>> {
  const { data } = await api.get<Paged<AdminUsuario>>("/admin/usuarios", { params });
  return data;
}

export async function patchEstadoUsuario(id_usuario: number, estado_activo: boolean) {
  const { data } = await api.patch("/admin/usuarios/" + id_usuario + "/estado", { estado_activo });
  return data as { id: number; estado_activo: boolean; actualizado: string };
}

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
  const { data } = await api.get("/admin/usuarios/" + id_usuario + "/actividad", { params });
  return data as {
    usuario: { id: number; nombre: string; correo: string; roles: string[] };
    total: number;
    items: ActividadItem[];
  };
}

export async function resetearPasswordUsuario(id_usuario: number, motivo: string) {
  const { data } = await api.post("/admin/usuarios/" + id_usuario + "/resetear-password", { motivo });
  return data as {
    id: number;
    reset_ok: boolean;
    requires_password_change: boolean;
    mensaje: string;
  };
}
