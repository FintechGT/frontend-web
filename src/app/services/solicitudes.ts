import api from "@/lib/api";

export type Foto = {
  id_foto?: number;
  url: string;
  orden?: number | null;
};

export type Articulo = {
  id_articulo: number;
  id_tipo: number;
  descripcion: string;
  valor_estimado: number;
  condicion: string;
  fotos: Foto[];
};

export type Solicitud = {
  id_solicitud: number;
  codigo?: string;
  estado: string;
  metodo_entrega?: string;
  direccion_entrega?: string;
  created_at?: string | null;
  fecha_envio?: string | null;
  fecha_vencimiento?: string | null;
  articulos: Articulo[];
};

// Lista “mis solicitudes completas”
export async function listMisSolicitudes(): Promise<Solicitud[]> {
  const res = await api.get("/solicitudes-completa");
  return res.data as Solicitud[];
}
