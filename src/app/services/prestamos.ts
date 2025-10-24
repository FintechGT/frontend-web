// src/app/services/prestamos.ts
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

async function parseJson<T>(res: Response): Promise<T> {
  const txt = await res.text();
  let data: unknown;
  try {
    data = txt ? JSON.parse(txt) : undefined;
  } catch {
    data = txt;
  }
  if (!res.ok) {
    const msg =
      (data as { detail?: string; message?: string } | undefined)?.detail ||
      (data as { message?: string } | undefined)?.message ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

function toSearchParams(obj: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  return q.toString();
}

/* =========================
   Tipos compartidos
========================= */

// Re-export para que puedas importar desde este módulo tal como hace la página [id]/page.tsx
export type { PagoItem } from "./pagos";

export type MovimientoItem = {
  id_mov: number;
  fecha: string;          // ISO o YYYY-MM-DD
  tipo: string;           // ej: "abono", "interes", "mora", etc.
  monto: number;
  nota?: string | null;
};

export type EstadoPrestamo = { id: number; nombre: string };

export type MiPrestamoItem = {
  id_prestamo: number;
  id_articulo: number;
  estado: EstadoPrestamo | string | null;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  monto_prestamo: number | string | null;
  deuda_actual: number | string | null;
  interes_acumulada: number | string | null;
  mora_acumulada: number | string | null;
};

export type MisPrestamosResp = {
  items: MiPrestamoItem[];
  total: number;
  limit?: number;
  offset?: number;
};

export type ArticuloDetalle = {
  id_articulo: number;
  id_tipo: number;
  tipo_nombre?: string | null;
  descripcion?: string | null;
  estado?: string | null;
  valor_estimado?: number | string | null;
  valor_aprobado?: number | string | null;
  fotos?: string[]; // URLs
};

export type ClienteMin = {
  id: number;
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
};

export type ContratoMin = {
  id_contrato: number;
  url_pdf: string;
};

export type PrestamoDetalleCompleto = {
  id_prestamo: number;
  estado: EstadoPrestamo;
  fecha_inicio: string;
  fecha_vencimiento: string;
  dias_mora: number;

  monto_prestamo: number;
  deuda_actual: number;
  interes_acumulada: number;
  mora_acumulada: number;

  total_pagado: number;

  articulo: ArticuloDetalle;
  cliente?: ClienteMin | null;
  contrato?: ContratoMin | null;

  pagos: import("./pagos").PagoItem[];
  movimientos?: MovimientoItem[];

  puede_pagar?: boolean;
  puede_liquidar?: boolean;
};

/* =========================
   Endpoints
========================= */

/** Listar MIS préstamos (para vistas del cliente) */
export async function listarMisPrestamos(params?: {
  limit?: number;
  offset?: number;
  estado?: string;
  sort?: "asc" | "desc";
}): Promise<MisPrestamosResp> {
  const qstr = toSearchParams({
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    estado: params?.estado,
    sort: params?.sort ?? "desc",
  });

  const res = await fetch(`${API_BASE}/prestamos/mis?${qstr}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return parseJson<MisPrestamosResp>(res);
}

/**
 * Obtener detalle COMPLETO de un préstamo para /prestamos/[id].
 * Ruta oficial del backend: GET /prestamos/:id/detalle-completo
 * Fallback opcional: /prestamos/:id/detalle
 */
export async function obtenerPrestamoDetalleCompleto(
  id_prestamo: number
): Promise<PrestamoDetalleCompleto> {
  const tryFetch = async (url: string): Promise<PrestamoDetalleCompleto> => {
    const res = await fetch(url, {
      headers: { ...authHeaders() },
      cache: "no-store",
    });
    return parseJson<PrestamoDetalleCompleto>(res);
  };

  // 1) Ruta oficial
  try {
    return await tryFetch(`${API_BASE}/prestamos/${id_prestamo}/detalle-completo`);
  } catch (e1) {
    // 2) Compatibilidad: /detalle (si existiera en algún entorno)
    try {
      return await tryFetch(`${API_BASE}/prestamos/${id_prestamo}/detalle`);
    } catch (e2) {
      const msg =
        e1 instanceof Error ? e1.message :
        e2 instanceof Error ? e2.message :
        "No se pudo obtener el detalle del préstamo.";
      throw new Error(`Detalle no disponible. Probé /detalle-completo y /detalle. ${msg}`);
    }
  }
}
