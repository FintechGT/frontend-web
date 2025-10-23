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

/**
 * GET /contratos/{id} - Obtener detalle de contrato
 */
export async function obtenerContrato(id_contrato: number) {
  try {
    console.log(`🔍 Obteniendo contrato ${id_contrato}...`);
    
    const { data } = await api.get<Contrato>(`/contratos/${id_contrato}`);
    
    console.log("✅ Contrato obtenido:", data);
    return data;
  } catch (error: any) {
    console.error(`❌ Error obtenerContrato(${id_contrato}):`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      }
    });
    
    // Mensajes de error específicos
    if (error.response?.status === 404) {
      throw new Error("Contrato no encontrado");
    }
    
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para ver este contrato");
    }
    
    if (error.response?.status === 401) {
      throw new Error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
    }
    
    // Error genérico con detalle del backend si existe
    const detalle = error.response?.data?.detail || error.message || "Error desconocido";
    throw new Error(`No se pudo cargar el contrato: ${detalle}`);
  }
}

/**
 * GET /contratos/mis - Mis contratos
 */
export async function misContratos() {
  try {
    console.log("🔍 Obteniendo mis contratos...");
    
    const { data } = await api.get<Contrato[]>("/contratos/mis");
    
    console.log("✅ Mis contratos obtenidos:", data.length);
    return data;
  } catch (error: any) {
    console.error("❌ Error misContratos:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    if (error.response?.status === 401) {
      throw new Error("Tu sesión ha expirado");
    }
    
    throw new Error(
      error.response?.data?.detail || 
      "No se pudieron cargar tus contratos"
    );
  }
}

/**
 * GET /contratos - Listar contratos (admin)
 */
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
  try {
    console.log("🔍 Listando contratos con params:", params);
    
    const { data } = await api.get<ContratoListResponse>("/contratos", { params });
    
    console.log("✅ Contratos listados:", data.total);
    return data;
  } catch (error: any) {
    console.error("❌ Error listarContratos:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    throw new Error(
      error.response?.data?.detail || 
      "No se pudieron cargar los contratos"
    );
  }
}

/**
 * POST /contratos/{id}/firmar
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
    console.log(`🔍 Firmando contrato ${id_contrato} como ${body.firmante}...`);
    
    const { data } = await api.post(`/contratos/${id_contrato}/firmar`, body);
    
    console.log("✅ Firma registrada:", data);
    return data as {
      id_contrato: number;
      firmante: "cliente" | "empresa";
      firma_registrada_en: string;
      contrato_completado: boolean;
    };
  } catch (error: any) {
    console.error("❌ Error firmarContrato:", error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error(`No tienes permiso para firmar como ${body.firmante}`);
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
 */
export async function firmarCriptograficamente(id_contrato: number) {
  try {
    console.log(`🔍 Firmando criptográficamente contrato ${id_contrato}...`);
    
    const { data } = await api.post(`/contratos/${id_contrato}/firmar-cripto`);
    
    console.log("✅ Firma criptográfica registrada:", data);
    return data as { 
      id_contrato: number; 
      url_pdf: string; 
      hash_doc: string; 
      firmado_cripto: boolean;
    };
  } catch (error: any) {
    console.error("❌ Error firmarCriptograficamente:", error.response?.data || error.message);
    
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
 */
export async function generarContrato(id_prestamo: number) {
  try {
    console.log(`🔍 Generando contrato para préstamo ${id_prestamo}...`);
    
    const { data } = await api.post(`/prestamos/${id_prestamo}/generar-contrato`);
    
    console.log("✅ Contrato generado:", data);
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
    console.error("❌ Error generarContrato:", error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error("Solo ADMINISTRADOR o VALUADOR pueden generar contratos");
    }
    
    if (error.response?.status === 404) {
      throw new Error("Préstamo no encontrado");
    }
    
    if (error.response?.status === 409) {
      throw new Error("Ya existe un contrato para este préstamo");
    }
    
    throw new Error(
      error.response?.data?.detail || 
      "No se pudo generar el contrato"
    );
  }
}