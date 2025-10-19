// src/lib/fetchFallback.ts
import api from "@/lib/api";

/**
 * Intenta GET sobre varias rutas hasta que alguna responda 200.
 * Si todas fallan, lanza el último error.
 */
export async function getWithFallback<T = unknown>(paths: string[]): Promise<T> {
  let lastError: unknown = null;
  for (const p of paths) {
    try {
      const r = await api.get<T>(p);
      return r.data;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("Todas las rutas de fallback fallaron");
}
