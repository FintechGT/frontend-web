// ============================================================
// src/app/services/articulosPublicos.ts
// ============================================================

import api from "@/lib/api";

/** ================= Tipos ================= */
export type ArticuloPublicoListItem = {
  id_articulo: number;
  id_tipo: number | null;
  tipo_nombre: string;
  descripcion: string;
  valor_estimado: number;
  valor_aprobado?: number | null;
  condicion?: string | null;
  estado: string;
  fotos: string[];
  precio_venta?: number | null;
  disponible_compra: boolean;
};

export type ArticuloPublicoListResponse = {
  items: ArticuloPublicoListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type ArticuloPublicoDetalle = {
  id_articulo: number;
  id_solicitud?: number | null;
  id_tipo?: number | null;
  tipo_nombre: string;
  descripcion: string;
  valor_estimado: number;
  valor_aprobado?: number | null;
  condicion?: string | null;
  estado: string;
  fotos: string[];
  precio_venta?: number | null;
  disponible_compra: boolean;
  fecha_ingreso_inventario?: string | null;
};

export type MedioPago = "efectivo" | "transferencia" | "tarjeta" | string;

export interface ComprarArticuloIn {
  precio_venta?: number | null;
  fecha_venta?: string | null;
  medio_pago?: MedioPago;
  ref_bancaria?: string | null;
  comprador_nombre?: string | null;
  comprador_nit?: string | null;
  comprobante_url?: string | null;
  nota?: string | null;
}

export interface ComprarArticuloOut {
  id_articulo: number;
  id_inventario: number;
  estado: string;
  precio_venta: number;
  fecha_venta?: string | null;
  mensaje: string;
}

const BASE = "/articulos-publicos";

/** ================= Helpers ================= */
function cleanParams<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.entries(obj) as [keyof T, unknown][]).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      out[k] = v as T[keyof T];
    }
  });
  return out;
}

/** ================= Endpoints ================= */
export interface ListArticulosParams {
  estado?: string | null;
  id_tipo?: number | null;
  q?: string | null;
  solo_en_venta?: boolean | null;
  limit?: number;
  offset?: number;
}

export async function listArticulosPublicos(
  params: ListArticulosParams = {}
): Promise<ArticuloPublicoListResponse> {
  const query = cleanParams({
    estado: params.estado ?? null,
    id_tipo: params.id_tipo ?? null,
    q: params.q ?? null,
    solo_en_venta: params.solo_en_venta ?? null,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  });

  const { data } = await api.get<ArticuloPublicoListResponse>(BASE, { params: query });
  return data;
}

export async function getArticuloPublico(id_articulo: number): Promise<ArticuloPublicoDetalle> {
  const { data } = await api.get<ArticuloPublicoDetalle>(`${BASE}/${id_articulo}`);
  return data;
}

export async function comprarArticuloPublico(
  id_articulo: number,
  payload: ComprarArticuloIn
): Promise<ComprarArticuloOut> {
  const { data } = await api.post<ComprarArticuloOut>(`${BASE}/${id_articulo}/comprar`, payload);
  return data;
}

/** ================= Atajos ================= */
export async function listSoloEnVenta(options?: {
  q?: string | null;
  id_tipo?: number | null;
  limit?: number;
  offset?: number;
}): Promise<ArticuloPublicoListResponse> {
  return listArticulosPublicos({
    q: options?.q ?? null,
    id_tipo: options?.id_tipo ?? null,
    solo_en_venta: true,
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0,
  });
}

export async function listPorEstado(
  estado: string,
  options?: { q?: string | null; id_tipo?: number | null; limit?: number; offset?: number }
): Promise<ArticuloPublicoListResponse> {
  return listArticulosPublicos({
    estado,
    q: options?.q ?? null,
    id_tipo: options?.id_tipo ?? null,
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0,
  });
}

export async function listPorCategoria(
  id_tipo: number,
  options?: { q?: string | null; solo_en_venta?: boolean | null; limit?: number; offset?: number }
): Promise<ArticuloPublicoListResponse> {
  return listArticulosPublicos({
    id_tipo,
    q: options?.q ?? null,
    solo_en_venta: options?.solo_en_venta ?? null,
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0,
  });
}
