// src/lib/api.ts
import axios, { AxiosError } from "axios";

/**
 * Resolución del baseURL:
 * - Si NEXT_PUBLIC_USE_PROXY === "1" -> usamos /api/proxy (Next route handler).
 * - Si no, usamos NEXT_PUBLIC_API_URL (o fallback http://127.0.0.1:8000).
 */
const useProxy = process.env.NEXT_PUBLIC_USE_PROXY === "1";
const rawBase =
  useProxy
    ? "/api/proxy"
    : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");

// Normaliza: sin slashes finales duplicados
export const baseURL = rawBase.replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  timeout: 30000,
  // OJO: por defecto JSON; cuando necesites blob, pásalo por request (no aquí).
  headers: { "Content-Type": "application/json" },
  // Estamos usando Bearer (no cookies de sesión)
  withCredentials: false,
  // Sólo considera éxito 2xx. Fuera de eso, cae al interceptor de error.
  validateStatus: (s) => s >= 200 && s < 300,
});

/**
 * Interceptor de REQUEST:
 * - Inyecta Authorization: Bearer <token> desde localStorage si existe.
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token =
        window.localStorage.getItem("access_token") ||
        window.localStorage.getItem("token");
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Interceptor de RESPONSE:
 * - Manejo de errores de red (CORS / backend caído) con mensaje claro.
 * - Log de errores de API con método, url y payload de error.
 * - Si 401, limpiamos storage y redirigimos a /login.
 *
 * NOTA: No toca llamadas de generar/firmar contrato; esas siguen igual,
 * y si alguna requiere blob, pásalo en la llamada:
 *   api.get(url, { responseType: "blob" })
 */
api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<any>) => {
    // Sin respuesta -> caída de red / CORS / DNS
    if (!error.response) {
      const url = (error.config?.baseURL || "") + (error.config?.url || "");
      console.error("❌ API Network Error:", {
        url,
        code: error.code,
        msg: error.message,
      });
      return Promise.reject(
        new Error(
          `No se pudo conectar con la API (${url}). ` +
          (useProxy
            ? "Revisa el proxy /api/proxy y que NEXT_PUBLIC_API_URL apunte bien."
            : "Revisa CORS en el backend y que la URL sea accesible desde http://localhost:3000.")
        )
      );
    }

    // Con respuesta -> error HTTP
    const { status, statusText, data } = error.response;
    const method = error.config?.method?.toUpperCase() || "GET";
    const fullUrl = (error.config?.baseURL || "") + (error.config?.url || "");

    console.error("❌ API Error:", {
      method,
      url: fullUrl,
      status,
      statusText,
      data,
    });

    if (status === 401 && typeof window !== "undefined") {
      try { window.localStorage.clear(); } catch {}
      // Evita bucle si ya estás en /login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    const msg =
      (typeof data === "string" && data) ||
      (typeof data?.detail === "string" && data.detail) ||
      (Array.isArray(data?.detail) && data.detail[0]?.msg) ||
      (data?.message as string) ||
      `Error ${status}: ${statusText || "API"}`;

    return Promise.reject(new Error(msg));
  },
);

export default api;
