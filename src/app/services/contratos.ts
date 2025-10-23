// src/app/services/contratos.ts
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

// -------- ENDPOINTS -----------------

/**
 * GET /contratos?q=...&estado_firma=...
 * Admin puede ver todos, usuarios solo los suyos
 */
export async function listarContratos(params?: {
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
  try {
    const { data } = await api.get<ContratoListResponse>("/contratos", { 
      params,
      // Asegura que axios serialice correctamente los params
      paramsSerializer: {
        indexes: null, // evita [] en arrays
      }
    });
    return data;
  } catch (error: any) {
    console.error("❌ Error en listarContratos:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      "No se pudieron cargar los contratos. Verifica tu conexión."
    );
  }
}

/**
 * GET /contratos/mis
 * Obtiene solo los contratos del usuario autenticado
 */
export async function misContratos() {
  try {
    const { data } = await api.get<Contrato[]>("/contratos/mis");
    return data;
  } catch (error: any) {
    console.error("❌ Error en misContratos:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      "No se pudieron cargar tus contratos."
    );
  }
}

/**
 * GET /contratos/{id}
 * Obtiene detalle de un contrato específico
 */
export async function obtenerContrato(id_contrato: number) {
  try {
    const { data } = await api.get<Contrato>(`/contratos/${id_contrato}`);
    return data;
  } catch (error: any) {
    console.error(`❌ Error al obtener contrato ${id_contrato}:`, error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error("Contrato no encontrado");
    }
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para ver este contrato");
    }
    
    throw new Error(
      error.response?.data?.detail || 
      "No se pudo cargar el contrato"
    );
  }
}

/**
 * POST /contratos/{id}/firmar
 * Registra una firma digital (cliente o empresa)
 */
export async function firmarContrato(
  id_contrato: number,
  body: { 
    firmante: "cliente" | "empresa"; 
    firma_digital: string; 
    ip?: string;
  }
) {
  try {
    const { data } = await api.post(`/contratos/${id_contrato}/firmar`, body);
    return data as {
      id_contrato: number;
      firmante: "cliente" | "empresa";
      firma_registrada_en: string;
      contrato_completado: boolean;
    };
  } catch (error: any) {
    console.error("❌ Error al firmar contrato:", error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para firmar como " + body.firmante);
    }
    if (error.response?.status === 404) {
      throw new Error("Contrato no encontrado");
    }
    
    throw new Error(
      error.response?.data?.detail || 
      "No se pudo registrar la firma"
    );
  }
}

/**
 * POST /contratos/{id}/firmar-cripto
 * Firma criptográfica con certificado X.509 (requiere config en servidor)
 */
export async function firmarCriptograficamente(id_contrato: number) {
  try {
    const { data } = await api.post(`/contratos/${id_contrato}/firmar-cripto`);
    return data as { 
      id_contrato: number; 
      url_pdf: string; 
      hash_doc: string; 
      firmado_cripto: boolean;
    };
  } catch (error: any) {
    console.error("❌ Error en firma criptográfica:", error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      throw new Error("Firma criptográfica no disponible en el servidor");
    }
    
    throw new Error(
      error.response?.data?.detail || 
      "No se pudo firmar criptográficamente"
    );
  }
}

/**
 * POST /prestamos/{id_prestamo}/generar-contrato
 * Genera el PDF del contrato (solo ADMIN/VALUADOR)
 */
export async function generarContrato(id_prestamo: number) {
  try {
    const { data } = await api.post(`/prestamos/${id_prestamo}/generar-contrato`);
    return data as {
      id_contrato: number;
      id_prestamo: number;
      url_pdf: string;
      hash_doc: string;
      estado: string;
      firma_cliente_en: string | null;
      firma_empresa_en: string | null;
    };
  } catch (error: any) {
    console.error("❌ Error al generar contrato:", error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error("Solo ADMINISTRADOR o VALUADOR pueden generar contratos");
    }
    if (error.response?.status === 404) {
      throw new Error("Préstamo no encontrado");
    }
    if (error.response?.status === 409) {
      throw new Error("Ya existe un contrato para este préstamo");
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.detail || "Estado del préstamo no válido para generar contrato");
    }
    
    throw new Error(
      error.response?.data?.detail || 
      "No se pudo generar el contrato"
    );
  }
}