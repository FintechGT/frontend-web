// src/app/services/adminSolicitudes.ts
import api from "@/lib/api";

/* =========================================================
   Tipos de Solicitudes (Admin)
   ========================================================= */
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

/* =========================================================
   Listado y Detalle
   ========================================================= */
export async function listarSolicitudesAdmin(
  params: ListarSolicitudesAdminParams = {}
): Promise<{ items: SolicitudAdmin[]; total: number; limit: number; offset: number }> {
  const { data } = await api.get("/admin/solicitudes", { params: cleanParams(params) });
  return data;
}

export async function obtenerSolicitudDetalleAdmin(
  id_solicitud: number
): Promise<SolicitudDetalleAdmin> {
  const { data } = await api.get(`/admin/solicitudes/${id_solicitud}`);
  return data;
}

/* =========================================================
   Evaluación de Artículos
   ---------------------------------------------------------
   A) Admin genérico:  POST /admin/solicitudes/articulos/{id}/evaluar
   B) Aprobar directo: POST /articulos/{id}/aprobar
   C) Rechazar directo:PATCH /articulo/rechazar/{id}/rechazar
   ========================================================= */

// A) Admin genérico (si aún lo usas en algún flujo)
export type EvaluarArticuloPayload = {
  accion: "aprobar" | "rechazar";
  valor_aprobado?: number;
  plazo_dias?: number;
  motivo?: string; // usar 'motivo' (no 'motivo_rechazo')
};

export async function evaluarArticulo(id_articulo: number, payload: EvaluarArticuloPayload) {
  const { data } = await api.post(
    `/admin/solicitudes/articulos/${id_articulo}/evaluar`,
    payload
  );
  return data;
}

// B) Aprobar directo (crea préstamo y deja artículo en 'evaluado')
export type AprobarArticuloPayload = {
  valor_aprobado: number;
  plazo_dias: number;
};

export type AprobarArticuloResponse = {
  estado_articulo: "evaluado";
  id_articulo: number;
  valor_aprobado: number;
  prestamo: {
    id_prestamo: number;
    estado: string; // "aprobado_pendiente_entrega"
    monto_prestamo: number;
    fecha_inicio: string;
    fecha_vencimiento: string;
  };
};

export async function aprobarArticulo(
  id_articulo: number,
  payload: AprobarArticuloPayload
) {
  const { data } = await api.post(`/articulos/${id_articulo}/aprobar`, payload);
  return data as AprobarArticuloResponse;
}

// C) Rechazar directo
export type RechazarArticuloPayload = { motivo: string };
export type RechazarArticuloResponse = {
  id_articulo: number;
  estado: "rechazado";
  motivo: string;
};

export async function rechazarArticulo(
  id_articulo: number,
  payload: RechazarArticuloPayload
) {
  const { data } = await api.patch(
    `/articulo/rechazar/${id_articulo}/rechazar`,
    payload
  );
  return data as RechazarArticuloResponse;
}

/* =========================================================
   Reglas por Tipo de Artículo (para validaciones en UI)
   ========================================================= */
export type ReglaTipoArticulo = {
  id_tipo: number;
  porcentaje_max_prestamo: number; // ej. 0.8  (80% del valor_estimado)
  // agrega aquí otros campos que tenga tu API si los necesitas
};

export async function obtenerReglasArticulos(): Promise<ReglaTipoArticulo[]> {
  const { data } = await api.get("/reglas/articulos");
  return data as ReglaTipoArticulo[];
}

export async function obtenerReglaTipoArticulo(id_tipo: number): Promise<ReglaTipoArticulo> {
  const { data } = await api.get(`/reglas/articulos/${id_tipo}`);
  return data as ReglaTipoArticulo;
}

/* =========================================================
   Contratos y Préstamos
   ========================================================= */

// Generar contrato (PDF) para un préstamo
export async function generarContratoPrestamo(id_prestamo: number) {
  const { data } = await api.post(`/prestamos/${id_prestamo}/generar-contrato`, {});
  // el backend suele devolver un string (ruta/archivo)
  return data as string;
}

// Activar préstamo (desembolso)
export type ActivarPrestamoPayload = {
  fecha_desembolso: string; // ISO "YYYY-MM-DDTHH:mm:ss"
  nota?: string;
};

export type ActivarPrestamoResponse = {
  estado_anterior: string;            // "aprobado_pendiente_entrega"
  estado_nuevo: string;               // "activo"
  fecha_desembolso: string;
  id_prestamo: number;
  mensaje: string;
};

export async function activarPrestamo(
  id_prestamo: number,
  payload: ActivarPrestamoPayload
) {
  const { data } = await api.patch(`/prestamos/${id_prestamo}/activar`, payload);
  return data as ActivarPrestamoResponse;
}

/* =========================================================
   Cambiar estado de Solicitud (manual)
   ========================================================= */
export async function cambiarEstadoSolicitud(
  id_solicitud: number,
  nuevo_estado: "evaluada" | "rechazada" | string,
  motivo?: string
) {
  const { data } = await api.patch(`/admin/solicitudes/${id_solicitud}/estado`, {
    nuevo_estado,
    motivo,
  });
  return data;
}

/* =========================================================
   Estadísticas Admin
   ========================================================= */
export type AdminStats = {
  total_solicitudes: number;
  por_estado: Record<string, number>;
  solicitudes_hoy: number;
  solicitudes_semana: number;
  articulos_pendientes_evaluacion: number;
};

export async function obtenerEstadisticasSolicitudes(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>("/admin/solicitudes/stats/dashboard");
  return data;
}
