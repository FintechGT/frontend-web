// src/app/services/adminSolicitudes.ts
import api from "@/lib/api";

export type SolicitudAdmin = {
  id_solicitud: number;
  id_usuario: number;
  usuario_nombre: string;
  usuario_correo: string;
  estado: string;
  fecha_envio: string;
  metodo_entrega: string;
  direccion_entrega?: string | null;
  total_articulos: number;
  articulos_aprobados: number;
  articulos_rechazados: number;
  articulos_pendientes: number;
};

export type SolicitudDetalleAdmin = {
  id_solicitud: number;
  estado: string;
  fecha_envio: string;
  metodo_entrega: string;
  direccion_entrega?: string | null;
  cliente: {
    id_usuario: number;
    nombre: string;
    correo: string;
    telefono?: string | null;
    direccion?: string | null;
  };
  articulos: Array<{
    id_articulo: number;
    id_tipo: number;
    tipo_nombre?: string | null;
    descripcion: string;
    valor_estimado: number;
    valor_aprobado?: number | null;
    condicion: string;
    estado: string;
    fotos: Array<{ id_foto: number; url: string; orden: number }>;
    tiene_prestamo: boolean;
    prestamo_id?: number | null;
    prestamo_estado?: string | null;
  }>;
  resumen: { total: number; aprobados: number; rechazados: number; pendientes: number };
};

export type ListarSolicitudesAdminParams = {
  estado?: string;
  usuario_id?: number;
  fecha_desde?: string; // YYYY-MM-DD
  fecha_hasta?: string; // YYYY-MM-DD
  metodo_entrega?: "domicilio" | "oficina";
  q?: string;
  limit?: number;
  offset?: number;
};

function cleanParams(p: ListarSolicitudesAdminParams = {}) {
  const out: Record<string, unknown> = {};
  if (p.estado) out.estado = p.estado.toLowerCase();
  if (p.usuario_id != null) out.usuario_id = p.usuario_id;
  if (p.fecha_desde) out.fecha_desde = p.fecha_desde;
  if (p.fecha_hasta) out.fecha_hasta = p.fecha_hasta;
  if (p.metodo_entrega) out.metodo_entrega = p.metodo_entrega.toLowerCase();
  if (p.q && p.q.trim()) out.q = p.q.trim();
  if (typeof p.limit === "number") out.limit = p.limit;
  if (typeof p.offset === "number") out.offset = p.offset;
  return out;
}

export async function listarSolicitudesAdmin(
  params: ListarSolicitudesAdminParams = {}
): Promise<{ items: SolicitudAdmin[]; total: number; limit: number; offset: number }> {
  const { data } = await api.get("/admin/solicitudes", { params: cleanParams(params) });
  return data;
}

export async function obtenerSolicitudDetalleAdmin(id_solicitud: number): Promise<SolicitudDetalleAdmin> {
  const { data } = await api.get(`/admin/solicitudes/${id_solicitud}`);
  return data;
}

export type EvaluarArticuloPayload = {
  accion: "aprobar" | "rechazar";
  valor_aprobado?: number;
  plazo_dias?: number;
  motivo_rechazo?: string;
};

export async function evaluarArticulo(id_articulo: number, payload: EvaluarArticuloPayload) {
  const { data } = await api.post(`/admin/solicitudes/articulos/${id_articulo}/evaluar`, payload);
  return data;
}

export async function cambiarEstadoSolicitud(id_solicitud: number, nuevo_estado: string, motivo?: string) {
  const { data } = await api.patch(`/admin/solicitudes/${id_solicitud}/estado`, {
    nuevo_estado,
    motivo,
  });
  return data;
}

export async function obtenerEstadisticasSolicitudes() {
  const { data } = await api.get("/admin/solicitudes/stats/dashboard");
  return data as {
    total_solicitudes: number;
    por_estado: Record<string, number>;
    solicitudes_hoy: number;
    solicitudes_semana: number;
    articulos_pendientes_evaluacion: number;
  };
}
