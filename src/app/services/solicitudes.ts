import api from "@/lib/api";

export type Solicitud = {
  id: string | number;
  codigo?: string;
  tipo?: string;
  estado?: string;
  monto?: number;
  fecha_vencimiento?: string;  
  created_at?: string;         
};

export async function listMisSolicitudes() {
  const res = await api.get("/solicitudes"); 
  return res.data as Solicitud[];
}
