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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

async function handle<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    // si no es JSON, dejamos el texto
    data = text;
  }
  if (!res.ok) {
    throw (data as { detail?: string; message?: string })?.detail ??
      (data as { message?: string })?.message ??
      `Error ${res.status}`;
  }
  return data as T;
}

export async function registerUser(body: RegisterInput): Promise<UserResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handle<UserResponse>(res);
}

export async function loginWithGoogle(id_token: string): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token }),
  });
  return handle<TokenResponse>(res);
}
