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
      (data as any)?.detail || (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/* =========================
   Tipos
========================= */
export type EstadoMini = { id?: number; nombre: string } | string;

export type MiPrestamoItem = {
  id_prestamo: number;
  id_articulo?: number;
  estado: EstadoMini;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  monto_prestamo?: number | string;
  deuda_actual?: number | string;
  mora_acumulada?: number | string;
  interes_acumulada?: number | string;
  ultimo_calculo_en?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MisPrestamosResp = {
  items: MiPrestamoItem[];
  total: number;
  limit?: number;
  offset?: number;
};

export type MovimientoItem = {
  id_mov: number;
  tipo: "interes" | "mora" | "pago" | "ajuste" | string;
  monto: number;
  nota?: string | null;
  fecha: string; // ISO
};

export type PagoItem = {
  id_pago: number;
  fecha_pago?: string | null;
  monto: number;
  estado: string;
  tipo_pago?: string | null;
  medio_pago?: string | null;
  ref_bancaria?: string | null;
  validador_id?: number | null;
  validador_nombre?: string | null;
  comprobantes?: string[];
};

export type PrestamoDetalleCompleto = {
  id_prestamo: number;
  estado: { id: number; nombre: string };
  fecha_inicio: string;
  fecha_vencimiento: string;
  monto_prestamo: number;
  deuda_actual: number;
  mora_acumulada: number;
  interes_acumulada: number;
  ultimo_calculo_en?: string | null;
  created_at: string;
  updated_at: string;
  articulo: {
    id_articulo: number;
    id_solicitud: number;
    id_tipo: number;
    tipo_nombre?: string | null;
    descripcion: string;
    valor_estimado: number;
    valor_aprobado?: number | null;
    condicion?: string | null;
    estado: string;
    fotos: string[];
  };
  cliente?: {
    id: number;
    nombre: string;
    correo: string;
    telefono?: string | null;
    direccion?: string | null;
  } | null;
  evaluador_id?: number | null;
  evaluador_nombre?: string | null;
  pagos: PagoItem[];
  total_pagado: number;
  contrato?: {
    id_contrato: number;
    url_pdf: string;
    hash_doc?: string | null;
    firma_cliente_en?: string | null;
    firma_empresa_en?: string | null;
    estado: string;
  } | null;
  movimientos?: MovimientoItem[] | null;
  puede_pagar: boolean;
  puede_liquidar: boolean;
  dias_mora: number;
};

/* =========================
   Endpoints
========================= */

/** Mis préstamos (usuario autenticado) */
export async function listarMisPrestamos(params?: {
  limit?: number;
  offset?: number;
  estado?: string;
}): Promise<MisPrestamosResp> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.estado) q.set("estado", params.estado);

  const res = await fetch(`${API_BASE}/prestamos/mis?${q.toString()}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return parseJson<MisPrestamosResp>(res);
}

/** Detalle completo de un préstamo (rol-aware) */
export async function obtenerPrestamoDetalleCompleto(
  id_prestamo: number
): Promise<PrestamoDetalleCompleto> {
  const res = await fetch(
    `${API_BASE}/prestamos/${id_prestamo}/detalle-completo`,
    {
      headers: { ...authHeaders() },
      cache: "no-store",
    }
  );
  return parseJson<PrestamoDetalleCompleto>(res);
}
