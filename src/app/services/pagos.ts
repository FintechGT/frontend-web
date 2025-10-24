// src/app/services/pagos.ts
import { getTokenFromClient } from "./auth";

/* =========================
   Config / helpers
========================= */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

function authHeaders(): Record<string, string> {
  const t = getTokenFromClient();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Intenta extraer un mensaje de error legible desde payloads desconocidos */
function extractApiMessage(data: unknown): string | undefined {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const detail = rec.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    const message = rec.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return undefined;
}

async function parseJson<T>(res: Response): Promise<T> {
  const txt = await res.text();
  let data: unknown;
  try {
    data = txt ? JSON.parse(txt) : undefined;
  } catch {
    data = txt;
  }
  if (!res.ok) {
    const msg = extractApiMessage(data) ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

function toSearchParams(
  obj: Record<string, string | number | undefined | null>
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  return q.toString();
}

/* =========================
   Tipos
========================= */
export type PagoItem = {
  id_pago: number;
  id_prestamo: number;
  id_estado?: number;
  estado?: string;
  fecha_pago?: string | null;
  monto: number;
  tipo_pago?: string | null;
  medio_pago?: string | null;
  ref_bancaria?: string | null;
  comprobantes?: { id_comprobante: number; url: string }[] | string[];
  // opcionales para vistas enriquecidas
  prestamo?: {
    id: number;
    estado: string;
    monto_prestamo: number;
    deuda_actual: number;
    mora_acumulada: number;
    interes_acumulada: number;
  } | null;
  cliente?: { id: number; nombre: string; correo: string } | null;
};

export type MisPagosResponse = {
  items: PagoItem[];
  total: number;
  limit?: number;
  offset?: number;
};

/** Alias para compatibilidad con imports antiguos */
export type PagosListResponse = MisPagosResponse;

export type PagosQuery = Partial<{
  estado: string;
  medio_pago: string;
  tipo_pago: string;
  ref_contains: string;
  fecha_desde: string; // YYYY-MM-DD
  fecha_hasta: string; // YYYY-MM-DD
  sort: "asc" | "desc";
  limit: number;
  offset: number;
}>;

/* =========================
   Endpoints
========================= */

/** Mis pagos (usuario autenticado) */
export async function listarMisPagos(params?: {
  limit?: number;
  offset?: number;
  id_prestamo?: number;
}): Promise<MisPagosResponse> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.id_prestamo != null) q.set("id_prestamo", String(params.id_prestamo));

  const res = await fetch(`${API_BASE}/prestamos/pagos/mis?${q.toString()}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return parseJson<MisPagosResponse>(res);
}

/** ========== SOBRECARGAS DE listarPagos ========== */
// 1) Listado global con filtros (admin/cajero/supervisor)
export async function listarPagos(query: PagosQuery): Promise<PagosListResponse>;
// 2) Pagos de un préstamo específico (admin/cajero/supervisor)
export async function listarPagos(
  id_prestamo: number,
  params?: { limit?: number; offset?: number }
): Promise<PagosListResponse>;

/** Implementación de sobrecargas */
export async function listarPagos(
  arg1: number | PagosQuery,
  arg2?: { limit?: number; offset?: number }
): Promise<PagosListResponse> {
  // Caso por préstamo
  if (typeof arg1 === "number") {
    const qstr = toSearchParams({
      limit: arg2?.limit,
      offset: arg2?.offset,
    });
    const res = await fetch(`${API_BASE}/prestamos/${arg1}/pagos?${qstr}`, {
      headers: { ...authHeaders() },
      cache: "no-store",
    });
    return parseJson<PagosListResponse>(res);
  }

  // Caso global con filtros
  const qstr = toSearchParams({
    estado: arg1.estado,
    medio_pago: arg1.medio_pago,
    tipo_pago: arg1.tipo_pago,
    ref_contains: arg1.ref_contains,
    fecha_desde: arg1.fecha_desde,
    fecha_hasta: arg1.fecha_hasta,
    sort: arg1.sort ?? "desc",
    limit: arg1.limit ?? 20,
    offset: arg1.offset ?? 0,
  });

  const res = await fetch(`${API_BASE}/pagos?${qstr}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return parseJson<PagosListResponse>(res);
}

/** Aliases claros (opcional usar en imports) */
export const listarPagosGlobal = (q: PagosQuery) => listarPagos(q);
export const listarPagosDePrestamo = (
  id_prestamo: number,
  params?: { limit?: number; offset?: number }
) => listarPagos(id_prestamo, params);

/** Respuesta mínima esperada al validar un pago (flexible) */
export type ValidarPagoResponse = {
  ok?: boolean;
  id_pago?: number;
  estado?: string;
  // permitir campos adicionales del backend sin usar `any`
  [key: string]: unknown;
};

/** Validar pago pendiente (admin/cajero/supervisor) */
export async function validarPago<T = ValidarPagoResponse>(
  id_pago: number,
  nota?: string
): Promise<T> {
  const res = await fetch(`${API_BASE}/pagos/${id_pago}/validar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ nota: nota ?? "Validado desde panel" }),
  });
  return parseJson<T>(res);
}
