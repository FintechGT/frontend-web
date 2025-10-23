// ============================================================
// src/app/services/contratos.ts
// ============================================================

import api from "@/lib/api";

export type EstadoFirma = "pendiente" | "parcial" | "completo";

export type Contrato = {
  id_contrato: number;
  id_prestamo: number;
  url_pdf: string;
  hash_doc: string;
  firma_cliente_en: string | null;
  firma_empresa_en: string | null;
  owner_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ContratoAdminRow = Contrato & {
  articulo?: string | null;
  monto_prestamo?: number;
  fecha_inicio?: string | null;
  fecha_vencimiento?: string | null;
};

export type ContratoListResponse = {
  total: number;
  limit: number;
  offset: number;
  es_admin: boolean;
  items: ContratoAdminRow[];
};

// ============================================================
// Helper para manejar rutas con y sin slash
// ============================================================

async function getWithSlashFallback<T>(path: string, params?: any) {
  try {
    // Intentar primero con el path tal cual
    const { data } = await api.get<T>(path, { params });
    return data;
  } catch (e) {
    // Si falla, intentar con la versión alterna (agregar o quitar slash)
    const alt = path.endsWith("/") ? path.slice(0, -1) : `${path}/`;
    const { data } = await api.get<T>(alt, { params });
    return data;
  }
}

// ============================================================
// ENDPOINTS
// ============================================================

/** Lista todos los contratos (modo administrador) */
export async function listarContratos(q?: {
  q?: string;
  usuario_id?: number;
  prestamo_id?: number;
  estado_firma?: EstadoFirma;
  fecha_desde?: string; // YYYY-MM-DD
  fecha_hasta?: string; // YYYY-MM-DD
  orden?: "reciente" | "antiguo";
  limit?: number;
  offset?: number;
}) {
  // ⚠️ importante: usa /contratos/ (con slash) para evitar el redirect del backend
  return getWithSlashFallback<ContratoListResponse>("/contratos/", q);
}

/** Contratos del usuario autenticado */
export async function misContratos() {
  const { data } = await api.get<Contrato[]>("/contratos/mis");
  return data;
}

/** Detalle de un contrato específico */
export async function obtenerContrato(id_contrato: number) {
  const { data } = await api.get<Contrato>(`/contratos/${id_contrato}`);
  return data;
}

/** Firma un contrato (cliente o empresa) */
export async function firmarContrato(
  id_contrato: number,
  body: { firmante: "cliente" | "empresa"; firma_digital: string; ip?: string }
) {
  const { data } = await api.post(`/contratos/${id_contrato}/firmar`, body);
  return data as {
    id_contrato: number;
    firmante: "cliente" | "empresa";
    firma_registrada_en: string;
    contrato_completado: boolean;
  };
}

/** Firma criptográficamente (solo admin) */
export async function firmarCriptograficamente(id_contrato: number) {
  const { data } = await api.post(`/contratos/${id_contrato}/firmar-cripto`);
  return data as {
    id_contrato: number;
    url_pdf: string;
    hash_doc: string;
    firmado_cripto: boolean;
  };
}
