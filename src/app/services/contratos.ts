// src/app/services/contratos.ts
import api from "@/lib/api";

export type EstadoFirma = "pendiente" | "parcial" | "completo";

/* ===== Tipos nuevos / actualizados (alineados a schemas) ===== */
export type EstadoResumen = { id: number; nombre: string };

export type ArticuloResumen = { descripcion?: string | null };

export type PrestamoResumen = {
  monto_prestamo: number;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  deuda_actual: number;
  mora_acumulada: number;
  interes_acumulada: number;
  estado: EstadoResumen;
  articulo: ArticuloResumen;
};

export type ContratoBase = {
  id_contrato: number;
  id_prestamo: number;
  url_pdf: string;
  hash_doc: string | null;
  firma_cliente_en: string | null;
  firma_empresa_en: string | null;
  owner_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ContratoDetalle = ContratoBase & {
  prestamo: PrestamoResumen; // <-- NUEVO (del backend)
};

export type ContratoAdminRow = ContratoBase & {
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

/* =========================
   Helpers de URL (BACKEND)
   ========================= */
function base() {
  return api.defaults.baseURL?.replace(/\/+$/, "") || "";
}

/** URL que redirige (descarga/visor nativo del navegador) */
export function urlAbrirContrato(id_contrato: number) {
  return `${base()}/contratos/${id_contrato}/abrir`;
}

/** URL que stream-ea el PDF via backend (seguro para <iframe>) */
export function urlVerContrato(id_contrato: number) {
  return `${base()}/contratos/${id_contrato}/ver`;
}

/** (Opcional) Obtener un Blob URL del PDF via backend */
export async function urlBlobContrato(id_contrato: number) {
  const resp = await api.get(`/contratos/${id_contrato}/ver`, { responseType: "blob" });
  const blob = new Blob([resp.data], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

/* =========================
   Endpoints principales
   ========================= */

/** GET /contratos/{id} */
export async function obtenerContrato(id_contrato: number) {
  const { data } = await api.get<ContratoDetalle>(`/contratos/${id_contrato}`);
  return data;
}

/** GET /contratos/mis */
export async function misContratos() {
  const { data } = await api.get<ContratoBase[]>("/contratos/mis");
  return data;
}

/** GET /contratos (admin) */
export async function listarContratos(params?: {
  q?: string;
  usuario_id?: number;
  prestamo_id?: number;
  estado_firma?: EstadoFirma;
  fecha_desde?: string;
  fecha_hasta?: string;
  orden?: "reciente" | "antiguo";
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get<ContratoListResponse>("/contratos", { params });
  return data;
}

/** POST /contratos/{id}/firmar */
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

/** POST /contratos/{id}/firmar-cripto */
export async function firmarCriptograficamente(id_contrato: number) {
  const { data } = await api.post(`/contratos/${id_contrato}/firmar-cripto`);
  return data as {
    id_contrato: number;
    url_pdf: string;
    hash_doc: string;
    firmado_cripto: boolean;
  };
}
