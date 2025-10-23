import api from "@/lib/api";

/** Listar pagos de un préstamo (con comprobantes) */
export async function listarPagosDePrestamo(
  id_prestamo: number,
  params?: { limit?: number; offset?: number }
) {
  const { data } = await api.get(`/prestamos/${id_prestamo}/pagos`, { params });
  return data as {
    items: Array<{
      id_pago: number;
      id_prestamo: number;
      id_estado: number;
      id_validador: number | null;
      fecha_pago: string | null;
      monto: number;
      tipo_pago: string | null;
      medio_pago: string | null;
      ref_bancaria: string | null;
      comprobantes: Array<{ id_comprobante: number; url: string }>;
    }>;
    total: number;
  };
}

/** Crear un pago pendiente */
export async function crearPago(payload: {
  id_prestamo: number;
  monto: number;
  medio_pago: string;
  ref_bancaria?: string;
  comprobante_url?: string;
}) {
  const { data } = await api.post("/crear-pagos", payload);
  return data as {
    id_pago: number;
    id_prestamo: number;
    estado: string;
    monto: number;
    medio_pago: string;
    ref_bancaria?: string | null;
    comprobante_url?: string | null;
  };
}

/** Validar un pago pendiente (solo CAJERO / ADMINISTRADOR / SUPERVISOR) */
export async function validarPago(id_pago: number, nota?: string) {
  const { data } = await api.post(`/pagos/${id_pago}/validar`, { nota });
  return data as {
    id_pago: number;
    estado: "validado";
    aplicacion: { mora: number; interes: number; capital: number };
    prestamo: {
      id: number;
      estado: string;
      deuda_actual: number;
      mora_acumulada: number;
      interes_acumulada: number;
    };
  };
}

