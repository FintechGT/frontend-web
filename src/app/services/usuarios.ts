// src/app/services/usuarios.ts
import api from "@/lib/api";

export type Perfil = {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
  verificado?: boolean;
  estado_activo?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UpdatePerfilInput = Partial<Pick<Perfil, "nombre" | "telefono" | "direccion">>;

export async function getPerfil(): Promise<Perfil> {
  const r = await api.get("/usuarios/me");
  return r.data as Perfil;
}

export async function updatePerfil(body: UpdatePerfilInput): Promise<Perfil> {
  const r = await api.patch("/usuarios/me", body);
  return r.data as Perfil;
}
