import axios, {
  type AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

/**
 * Resolución de baseURL:
 * - Si NEXT_PUBLIC_USE_PROXY === "1" -> usamos /api/proxy (Next route handler).
 * - Si no, usamos NEXT_PUBLIC_API_URL (o fallback http://127.0.0.1:8000).
 */
const useProxy = process.env.NEXT_PUBLIC_USE_PROXY === "1";
const rawBase = useProxy
  ? "/api/proxy"
  : process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Normaliza: sin slashes finales duplicados
export const baseURL = rawBase.replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  validateStatus: (s: number) => s >= 200 && s < 300,
});

/* ==== utils de tipado seguro ==== */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractMessage(data: unknown): string | undefined {
  if (typeof data === "string" && data) return data;
  if (!isRecord(data)) return undefined;

  const d = data as Record<string, unknown>;
  if (typeof d.detail === "string" && d.detail) return d.detail;

  const det = d.detail as unknown;
  if (Array.isArray(det) && det.length > 0) {
    const first = det[0] as Record<string, unknown> | undefined;
    const msg = first?.msg;
    if (typeof msg === "string" && msg) return msg;
  }
  if (typeof d.message === "string" && d.message) return d.message;
  return undefined;
}

/** Interceptor de REQUEST: agrega Authorization si hay token en LS. */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token =
        window.localStorage.getItem("access_token") ||
        window.localStorage.getItem("token");

      if (token) {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        } else if (!(config.headers instanceof AxiosHeaders)) {
          config.headers = new AxiosHeaders(config.headers);
        }
        (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/** Interceptor de RESPONSE: maneja errores de red y 401. */
api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<unknown>) => {
    // Sin respuesta -> red/CORS/DNS
    if (!error.response) {
      const url = `${error.config?.baseURL || ""}${error.config?.url || ""}`;
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
              : "Revisa CORS en el backend y que la URL sea accesible."),
        ),
      );
    }

    // Con respuesta -> error HTTP
    const { status, statusText, data } = error.response;
    const method = error.config?.method?.toUpperCase() || "GET";
    const fullUrl = `${error.config?.baseURL || ""}${error.config?.url || ""}`;

    console.error("❌ API Error:", {
      method,
      url: fullUrl,
      status,
      statusText,
      data,
    });

    if (status === 401 && typeof window !== "undefined") {
      try {
        window.localStorage.clear();
      } catch {
        /* noop */
      }
      // redirigir opcional:
      // window.location.href = "/login";
    }

    const msg = extractMessage(data) || `HTTP ${status} ${statusText || ""}`.trim();
    return Promise.reject(new Error(msg));
  },
);

export default api;
