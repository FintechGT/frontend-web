import api from "@/lib/api";

/** ====== Tipos ====== */
export type RegisterInput = {
  nombre: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type UserResponse = {
  ID_Usuario: number;
  Nombre: string;
  Correo: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
};

/** Perfil normalizado para el frontend (camelCase). */
export type Me = {
  idUsuario: number;
  nombre: string;
  correo: string;
  verificado?: boolean;
  estadoActivo?: boolean;
};

// Alias
export type User = Me;

function mapMe(raw: unknown): Me {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    idUsuario: Number(o.ID_Usuario ?? o.idUsuario ?? o.id_usuario ?? o.id ?? 0),
    nombre: String(o.Nombre ?? o.nombre ?? ""),
    correo: String(o.Correo ?? o.correo ?? ""),
    verificado:
      o.Verificado === undefined && o.verificado === undefined
        ? undefined
        : Boolean(o.Verificado ?? o.verificado),
    estadoActivo:
      o.Estado_Activo === undefined && o.estado_activo === undefined
        ? undefined
        : Boolean(o.Estado_Activo ?? o.estado_activo),
  };
}

/* =========================
   Auth API (axios)
========================= */

export async function registerUser(body: RegisterInput): Promise<UserResponse> {
  const r = await api.post<UserResponse>("/auth/register", body);
  return r.data;
}

export async function loginUser(body: LoginInput): Promise<TokenResponse> {
  const r = await api.post<TokenResponse>("/auth/login", body);
  return r.data;
}

export async function loginWithGoogle(id_token: string): Promise<TokenResponse> {
  // Si tu backend espera { id_token } por POST:
  const r = await api.post<TokenResponse>("/auth/google", { id_token });
  return r.data;
}

/* =========================
   Token helpers (cliente)
========================= */
export function getTokenFromClient(): string | null {
  if (typeof window === "undefined") return null;
  const fromLs = window.localStorage.getItem("access_token");
  if (fromLs) return fromLs;
  const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
  document.cookie = `access_token=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=86400; SameSite=Lax`;
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  document.cookie = "access_token=; Path=/; Max-Age=0; SameSite=Lax";
}

/* =========================
   Perfil
========================= */
export async function getMe(token?: string): Promise<Me> {
  if (!token && typeof window !== "undefined") {
    token = getTokenFromClient() ?? undefined;
  }
  if (!token) throw new Error("No hay token de sesión");

  const r = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return mapMe(r.data);
}

export async function getMeFromClient(): Promise<Me> {
  return getMe();
}
