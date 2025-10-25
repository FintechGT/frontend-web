import api from "@/lib/api";

/** ====== Tipos ====== */
export type RegisterInput = {
  username: string;   // el backend espera 'username'
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

export type User = Me;

/* =========================
   Mapeo de perfil
========================= */
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
  const payload = {
    username: String(body.username ?? "").normalize("NFKC").trim(),
    email: String(body.email ?? "").normalize("NFKC").trim().toLowerCase(),
    password: String(body.password ?? "").normalize("NFKC").trim(),
  };
  const r = await api.post<UserResponse>("/auth/register", payload);
  return r.data;
}

export async function loginUser(body: LoginInput): Promise<TokenResponse> {
  const payload = {
    email: String(body.email ?? "").normalize("NFKC").trim().toLowerCase(),
    password: String(body.password ?? "").normalize("NFKC").trim(),
  };
  const r = await api.post<TokenResponse>("/auth/login", payload);
  return r.data;
}

export async function loginWithGoogle(id_token: string): Promise<TokenResponse> {
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
  let t = token;
  if (!t && typeof window !== "undefined") {
    t = getTokenFromClient() ?? undefined;
  }
  if (!t) throw new Error("No hay token de sesión");

  const r = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${t}` },
  });
  return mapMe(r.data);
}

export async function getMeFromClient(): Promise<Me> {
  return getMe();
}

/* =========================
   Roles (INVITADO)
========================= */

type RoleItem = {
  ID_rol?: number;      // ← nombre correcto según tu API
  nombre?: string;
  clave?: string;
};
type RolesResponse = RoleItem[];

/** GET roles del usuario (opcional para evitar duplicados) */
async function getUserRoles(access_token: string, userId: number): Promise<RolesResponse> {
  try {
    const r = await api.get<RolesResponse>(`/usuarios/${userId}/roles`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return Array.isArray(r.data) ? r.data : [];
  } catch {
    return [];
  }
}

/** POST /usuarios/{id_usuario}/roles  body: { items: [7] } */
async function assignRoleInvitado(access_token: string, userId: number): Promise<void> {
  await api.post(
    `/usuarios/${userId}/roles`,
    { items: [7] },
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
}

/** Idempotente: si ya tiene INVITADO no hace nada; si no, lo asigna */
export async function ensureDefaultRoleInvitado(access_token: string): Promise<void> {
  const me = await getMe(access_token);
  const roles = await getUserRoles(access_token, me.idUsuario);

  const hasInvitado =
    roles.length > 0 &&
    roles.some((r) => r.ID_rol === 7 || r.nombre?.toUpperCase() === "INVITADO" || r.clave?.toUpperCase() === "INVITADO");

  if (!hasInvitado) {
    try {
      await assignRoleInvitado(access_token, me.idUsuario);
    } catch {
      // si la API devuelve conflicto por duplicado, lo ignoramos
    }
  }
}

/* =========================
   Flujos compuestos
========================= */

/** Registrar → login → guardar token → asegurar rol INVITADO → devolver token */
export async function registerThenLoginEnsureInvitado(
  input: RegisterInput
): Promise<TokenResponse> {
  await registerUser(input);

  const { access_token } = await loginUser({
    email: input.email,
    password: input.password,
  });

  saveToken(access_token);
  await ensureDefaultRoleInvitado(access_token);

  return { access_token, token_type: "bearer" };
}

/** Google → guardar token → asegurar rol INVITADO → devolver token */
export async function loginWithGoogleEnsureInvitado(
  id_token: string
): Promise<TokenResponse> {
  const { access_token } = await loginWithGoogle(id_token);
  saveToken(access_token);
  await ensureDefaultRoleInvitado(access_token);
  return { access_token, token_type: "bearer" };
}
