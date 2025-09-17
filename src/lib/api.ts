import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api", 
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
    const msg =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Network Error";
    return Promise.reject(new Error(msg));
  }
);

export default api;
