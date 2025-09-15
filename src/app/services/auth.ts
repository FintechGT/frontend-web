"use client";
import api from "@/lib/api";

interface LoginInput {
  email: string;
  password: string;
}
interface RegisterInput {
  nombre: string;
  email: string;
  password: string;
}

export async function loginUser(data: LoginInput) {
  const res = await api.post("/auth/login", data);
  return res.data;
}

export async function registerUser(data: RegisterInput) {
  const res = await api.post("/auth/register", data);
  return res.data;
}
