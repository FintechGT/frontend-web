// src/lib/api.ts
import axios from "axios";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

if (typeof window !== "undefined") {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText || "";
      const data = error.response?.data;
      const detail =
        (data && typeof (data as any).detail === "string" && (data as any).detail) ||
        (data && typeof (data as any).message === "string" && (data as any).message) ||
        (typeof data === "string" ? data : data ? JSON.stringify(data) : "");
      let fullUrl = "";
      try {
        const path = error.config?.url || "";
        fullUrl = baseURL ? new URL(path, baseURL).toString() : path;
      } catch {
        fullUrl = error.config?.url || "";
      }
      let msg: string;
      if (status) {
        msg = `[${status}] ${statusText} ${detail}`.trim();
        if (fullUrl) msg += ` @ ${fullUrl}`;
      } else if (error.code === "ERR_NETWORK") {
        msg = `ERR_NETWORK: posible CORS/SSL/servidor caído${fullUrl ? ` @ ${fullUrl}` : ""}`;
      } else {
        msg = error.message || "Network Error";
      }
      return Promise.reject(new Error(msg));
    }
    return Promise.reject(error);
  }
);

export default api;
