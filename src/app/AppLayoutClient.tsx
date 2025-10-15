// src/app/AppLayoutClient.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getMe, type Me } from "@/app/services/auth";
import { getMisPermisos } from "@/app/services/permisos";

type AuthCtx = {
  user: Me | null;
  permisos: string[]; // 👈 NUEVO
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
  can: (permiso: string) => boolean; // 👈 NUEVO helper
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  permisos: [],
  loading: true,
  refresh: async () => {},
  logout: () => {},
  can: () => false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const [u, p] = await Promise.all([
        getMe(),
        getMisPermisos()
      ]);
      setUser(u ?? null);
      setPermisos(p);
    } catch {
      setUser(null);
      setPermisos([]);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    setUser(null);
    setPermisos([]);
  };

  // Helper para verificar permisos
  const can = (permiso: string): boolean => {
    return permisos.includes(permiso.toLowerCase());
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    void refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, permisos, loading, refresh, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}