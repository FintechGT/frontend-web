import api from "@/lib/api";

export type RegisterInput = { nombre: string; email: string; password: string };

export async function registerUser({ nombre, email, password }: RegisterInput) {
  const res = await api.post("/auth/register", { username: nombre, email, password });
  return res.data;
}

export async function loginUser(email: string, password: string) {
  const res = await api.post("/auth/login", { email, password });
  return res.data as { access_token: string; token_type?: string };
}

export type Me = {
  id: number | string;
  nombre?: string;
  email: string;
  rol?: string;
};

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data as Me;
}
export async function loginWithGoogle(id_token: string) {
  const res = await api.post("/auth/google", { id_token });
  return res.data as { access_token: string; token_type?: string };
}

