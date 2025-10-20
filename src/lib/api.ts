// src/lib/api.ts
import axios, { AxiosError } from "axios";

/** Base URL configurable desde el entorno */
const baseURL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "");

/** Tipo auxiliar para validar objetos JSON */
type JsonRecord = Record<string, unknown>;
function isRecord(x: unknown): x is JsonRecord {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/** Instancia principal de Axios */
const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/** Interceptor de solicitud: agrega token si existe */
if (typeof window !== "undefined") {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

/** Interceptor de respuesta: manejo uniforme de errores */
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const ax = error as AxiosError<unknown>;
      const status = ax.response?.status;
      const statusText = ax.response?.statusText || "";
      const data = ax.response?.data;

      let detail = "";
      if (typeof data === "string") {
        detail = data;
      } else if (isRecord(data)) {
        if (typeof data.detail === "string") detail = data.detail;
        else if (typeof data.message === "string") detail = data.message;
        else detail = JSON.stringify(data);
      }

      let fullUrl = "";
      try {
        const path = ax.config?.url || "";
        fullUrl = baseURL ? new URL(path, baseURL).toString() : path;
      } catch {
        fullUrl = ax.config?.url || "";
      }

      let msg: string;
      if (status) {
        msg = `[${status}] ${statusText} ${detail}`.trim();
        if (fullUrl) msg += ` @ ${fullUrl}`;
      } else if (ax.code === "ERR_NETWORK") {
        msg = `ERR_NETWORK: posible CORS/SSL/servidor caído${fullUrl ? ` @ ${fullUrl}` : ""}`;
      } else {
        msg = ax.message || "Network Error";
      }

      return Promise.reject(new Error(msg));
    }

    // Si no es AxiosError
    const msg = error instanceof Error ? error.message : "Network Error";
    return Promise.reject(new Error(msg));
  }
);

export default api;
