// src/app/services/auth.ts
export type RegisterInput = {
  nombre: string;
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data as { detail?: string })?.detail ??
      (data as { message?: string })?.message ??
      `Error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

function mapMe(raw: unknown): Me {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    idUsuario: Number(
      o.ID_Usuario ?? o.idUsuario ?? o.id_usuario ?? o.id ?? 0
    ),
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

export async function registerUser(body: RegisterInput): Promise<UserResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<UserResponse>(res);
}

export async function loginWithGoogle(id_token: string): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token }),
  });
  return parseResponse<TokenResponse>(res);
}

/** Lee token desde localStorage o cookie (solo cliente). */
export function getTokenFromClient(): string | null {
  if (typeof window === "undefined") return null;
  const fromLs = window.localStorage.getItem("access_token");
  if (fromLs) return fromLs;
  const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Obtiene el perfil. Si no pasas token:
 *  - En cliente: lo intenta leer de storage/cookie.
 *  - En servidor: lanza error.
 */
export async function getMe(token?: string): Promise<Me> {
  let t = token;
  if (!t) {
    if (typeof window === "undefined") {
      throw new Error("No hay token de sesión");
    }
    t = getTokenFromClient() ?? undefined;
    if (!t) throw new Error("No hay token de sesión");
  }

  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${t}` },
    cache: "no-store",
  });
  const raw = await parseResponse<unknown>(res);
  return mapMe(raw);
}

/** Azúcar para cliente: usa storage/cookie y llama a /auth/me. */
export async function getMeFromClient(): Promise<Me> {
  return getMe();
}
