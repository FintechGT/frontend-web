import api from "@/lib/api";

/** ===== Tipos base ===== */
export type JwtPayloadBase = Record<string, unknown> & {
  sub?: string | number;
  exp?: number;
  iat?: number;
  roles?: unknown;
};

export interface UsuarioAuth {
  id: number;
  nombre: string;
  correo: string;
  roles: string[];
}

export interface AuthMeResponse {
  usuario: UsuarioAuth;
  token?: string;
}

/** ===== Type guards ===== */
export function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((i) => typeof i === "string");
}

/** ===== JWT ===== */
export function parseJWT<T extends JwtPayloadBase = JwtPayloadBase>(token: string): T | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const obj: unknown = JSON.parse(json);
    if (obj && typeof obj === "object") return obj as T;
    return null;
  } catch {
    return null;
  }
}

export function tokenExpirado(token: string | null): boolean {
  if (!token) return true;
  const payload = parseJWT(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp;
}

/** ===== Local storage ===== */
const ACCESS_TOKEN_KEY = "access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/** ===== Headers ===== */
export function authHeader(): Record<string, string> {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** ===== Roles / permisos ===== */
export function rolesDesdeToken(token: string | null): string[] {
  if (!token) return [];
  const payload = parseJWT(token);
  const roles = payload?.roles;
  return isStringArray(roles) ? roles : [];
}

export function tienePermiso(permiso: string, roles: string[]): boolean {
  const target = permiso.toLowerCase();
  const set = new Set(roles.map((r) => r.toLowerCase()));
  if (set.has("admin") || set.has("administrador")) return true;
  return set.has(target) || set.has(`${target}.view`) || set.has(`${target}.listar`);
}

/** ===== API tipada ===== */
export async function authMe(): Promise<AuthMeResponse> {
  const { data } = await api.get<AuthMeResponse>("/auth/me");
  return data;
}

export async function refreshToken(): Promise<{ token: string }> {
  const { data } = await api.post<{ token: string }>("/auth/refresh");
  return data;
}

/** ===== Errores sin `any` ===== */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "Error desconocido";
}
