// src/app/(app)/dashboard/seguridad/page.tsx
"use client";

import * as React from "react";
import { Shield, AlertCircle, RotateCw } from "lucide-react";
import api from "@/lib/api";
import RolesTab from "./_components/RolesTab";
import PermisosTab from "./_components/PermisosTab";
import ModulosTab from "./_components/ModulosTab";

/** Tabs minimalistas sin dependencias externas */
function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-6 inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              value === t.value ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getErrMsg(err: unknown): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const r = (err as any).response;
    const code = r?.status;
    const msg = r?.data?.detail || r?.statusText || "Error";
    if (code === 404) return "Endpoint no encontrado (404). Revisa rutas del backend.";
    if (code === 401) return "No autorizado (401). Verifica el token/Authorization header.";
    return `${code ?? ""} ${msg}`.trim();
  }
  if (err instanceof Error) return err.message;
  return "Error desconocido";
}

function isAdmin(roles: string[]): boolean {
  return roles.map((r) => r.toLowerCase()).some((r) => r === "admin" || r === "administrador");
}

export default function SeguridadDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [allowed, setAllowed] = React.useState(false);

  const [tab, setTab] = React.useState<"roles" | "permisos" | "modulos">("roles");

  const bootstrap = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/seguridad/mis-roles");
      const roles = Array.isArray(data) ? data : Array.isArray(data?.roles) ? data.roles : [];
      setAllowed(isAdmin(roles));
    } catch (e) {
      setError(getErrMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-blue-400" />
        <h1 className="text-2xl font-semibold">Seguridad</h1>
        <button
          onClick={() => void bootstrap()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          title="Refrescar"
        >
          <RotateCw className="size-4" />
          Refrescar
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-10 text-neutral-400">
          <RotateCw className="mr-2 animate-spin" />
          Cargando…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          <AlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {!loading && !error && !allowed && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-yellow-300">
          <AlertCircle className="mr-2 inline-block" />
          Solo los usuarios con rol <b>ADMIN/ADMINISTRADOR</b> pueden gestionar Seguridad.
        </div>
      )}

      {!loading && !error && allowed && (
        <>
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as any)}
            tabs={[
              { value: "roles", label: "Roles" },
              { value: "permisos", label: "Permisos" },
              { value: "modulos", label: "Módulos" },
            ]}
          />
          {tab === "roles" && <RolesTab />}
          {tab === "permisos" && <PermisosTab />}
          {tab === "modulos" && <ModulosTab />}
        </>
      )}
    </div>
  );
}
