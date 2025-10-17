import api from "@/lib/api";

/** ===== Tipos ===== */
export type Foto = {
  id_foto?: number;
  url: string;
  orden?: number | null;
};

export type Articulo = {
  id_articulo: number;
  id_tipo: number;
  descripcion: string;
  valor_estimado: number;
  condicion: string;
  fotos: Foto[];
};

export type Solicitud = {
  id_solicitud: number;
  codigo?: string | null;                                // <- ahora acepta null
  estado: string;
  metodo_entrega?: "domicilio" | "oficina" | string | null; // <- ahora acepta null
  direccion_entrega?: string | null;                     // <- ahora acepta null
  created_at?: string | null;
  fecha_envio?: string | null;
  fecha_vencimiento?: string | null;
  articulos: Articulo[];
};

export type NuevaFoto = { url: string; orden?: number | null };
export type NuevoArticulo = {
  id_tipo: number;
  descripcion: string;
  valor_estimado: number;
  condicion: string;
  fotos: NuevaFoto[];
};
export type NuevaSolicitudPayload = {
  metodo_entrega: "domicilio" | "oficina";
  direccion_entrega?: string;
  articulos: NuevoArticulo[];
};

export type Paged<T> = { total: number; items: T[] };

/** ===== Endpoints existentes (cliente) ===== */
export async function listMisSolicitudes(): Promise<Solicitud[]> {
  const res = await api.get("/solicitudes-completa");
  return res.data as Solicitud[];
}

export async function getSolicitudCompleta(id: number): Promise<Solicitud> {
  const res = await api.get(`/solicitudes-completa/${id}`);
  return res.data as Solicitud;
}

export async function crearSolicitudCompleta(payload: NuevaSolicitudPayload): Promise<Solicitud> {
  const res = await api.post("/solicitudes-completa", payload);
  return res.data as Solicitud;
}

/** ===== Nuevos helpers ===== */

/** Lista artículos de una solicitud por el endpoint:
 *   GET /solicitudes/{id_solicitud}/articulos
 */
export async function getArticulosSolicitud(id_solicitud: number): Promise<Articulo[]> {
  const { data } = await api.get(`/solicitudes/${id_solicitud}/articulos`);
  return data as Articulo[];
}

/** Admin: (si lo necesitas en otro lado) listar todas las solicitudes.
 *  OJO: este endpoint suele devolver datos parciales; para el listado
 *  preferimos usar adminSolicitudes.ts y adaptar a un tipo “lite”.
 */
const ADMIN_SOLICITUDES_BASE = "/admin/solicitudes";

export type ListTodasParams = {
  q?: string | null;
  estado?: string | null;
  metodo?: "domicilio" | "oficina" | null;
  usuario?: string | number | null; // correo o id
  fecha_from?: string | null;       // YYYY-MM-DD
  fecha_to?: string | null;         // YYYY-MM-DD
  sort?: "fecha" | "codigo" | "estado" | "metodo" | "usuario";
  dir?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export async function listTodasSolicitudes(params: ListTodasParams = {}): Promise<Paged<Solicitud>> {
  const { data } = await api.get<Paged<Solicitud>>(ADMIN_SOLICITUDES_BASE, { params });
  return data;
}

/** Admin: cambiar estado de una solicitud. */
export async function updateEstadoSolicitud(
  id_solicitud: number,
  estado: "aprobado" | "rechazado" | "en_revision" | "pendiente",
  comentario?: string
): Promise<{ id_solicitud: number; estado: string; actualizado: string }> {
  const { data } = await api.patch(`${ADMIN_SOLICITUDES_BASE}/${id_solicitud}`, {
    estado,
    comentario: comentario ?? null,
  });
  return data as { id_solicitud: number; estado: string; actualizado: string };
}
