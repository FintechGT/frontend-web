// src/app/services/apiClient.ts
import { getTokenFromClient } from "./auth";

export const apiBase = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

/** Devuelve headers con Authorization si hay token */
export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getTokenFromClient();
  const base: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  return { ...base, ...(extra || {}) };
}
