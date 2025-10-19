// src/app/AppLayoutClient.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getMe, type Me } from "@/app/services/auth";
import { getMisPermisos } from "@/app/services/permisos";
import api from "@/lib/api";

type AuthCtx = {
  user: Me | null;
  permisos: string[];
  roles: string[];
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
  can: (permiso: string) => boolean;
  hasRole: (rol: string) => boolean;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  permisos: [],
  roles: [],
  loading: true,
  refresh: async () => {},
  logout: () => {},
  can: () => false,
  hasRole: () => false,
});

export function useAuth() {
  return useContext(AuthContext);
}

async function getMisRoles(): Promise<string[]> {
  try {
    const r = await api.get("/seguridad/mis-roles");
    const data = r.data;
    const roles = Array.isArray(data) ? data : data?.roles;
    return Array.isArray(roles) ? roles.map((x) => String(x)) : [];
  } catch (err) {
    console.error("❌ Error cargando roles:", err);
    return [];
  }
}

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = async () => {
    try {
      setLoading(true);
      console.log("🔄 Cargando datos de usuario...");
      
      const [u, p, r] = await Promise.all([
        getMe(),
        getMisPermisos(),
        getMisRoles(),
      ]);
      
      console.log("✅ Datos cargados:", {
        usuario: u,
        permisos: p,
        roles: r
      });
      
      setUser(u ?? null);
      setPermisos((p ?? []).map((x) => String(x).toLowerCase()));
      setRoles((r ?? []).map((x) => String(x)));

      if (typeof window !== "undefined") {
        localStorage.setItem("permisos", JSON.stringify(p ?? []));
        localStorage.setItem("roles", JSON.stringify(r ?? []));
      }
    } catch (err) {
      console.error("❌ Error en refresh:", err);
      setUser(null);
      setPermisos([]);
      setRoles([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem("permisos");
        localStorage.removeItem("roles");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/login";
    }
    setUser(null);
    setPermisos([]);
    setRoles([]);
  };

  const can = (permiso: string): boolean => {
    return permisos.includes(permiso.toLowerCase());
  };

  const hasRole = (rol: string): boolean => {
    const target = rol.toUpperCase();
    return roles.some((mine) => mine.toUpperCase() === target);
  };

  // Cargar datos UNA SOLA VEZ al montar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    void refresh();
  }, []); // ✅ Sin dependencias = solo se ejecuta una vez

  return (
    <AuthContext.Provider
      value={{ user, permisos, roles, loading, refresh, logout, can, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}