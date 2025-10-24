// src/app/services/prestamos.ts
import { getTokenFromClient } from "./auth";

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
      (typeof data === "object" && data && "detail" in (data as Record<string, unknown>) && typeof (data as { detail?: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : undefined) ||
      (typeof data === "object" && data && "message" in (data as Record<string, unknown>) && typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : undefined) ||
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

export type MiPrestamoItem = {
  id_prestamo: number;
  id_articulo: number;
  estado: { id: number; nombre: string } | string | null;
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

export type MisPrestamosQuery = Partial<{
  estado: string;
  sort: "asc" | "desc";
  limit: number;
  offset: number;
}>;

/** Mis préstamos (usuario autenticado) */
export async function listarMisPrestamos(q: MisPrestamosQuery): Promise<MisPrestamosResp> {
  const qstr = toSearchParams({
    estado: q.estado,
    sort: q.sort ?? "desc",
    limit: q.limit ?? 20,
    offset: q.offset ?? 0,
  });

  const res = await fetch(`${API_BASE}/prestamos/mis?${qstr}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  return parseJson<MisPrestamosResp>(res);
}
