// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor para añadir token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor de respuesta MEJORADO (manejo seguro de errores)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejo seguro: verifica que las propiedades existan antes de acceder
    const errorDetails = {
      url: error.config?.url || "unknown",
      method: error.config?.method?.toUpperCase() || "unknown",
      status: error.response?.status || 0,
      statusText: error.response?.statusText || "unknown",
      data: error.response?.data || null,
      message: error.message || "Unknown error",
    };

    console.error("❌ API Error:", errorDetails);

    // Redirigir a login si es 401
    if (error.response?.status === 401) {
      console.warn("🔒 No autorizado - token inválido o expirado");
      if (typeof window !== "undefined") {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;