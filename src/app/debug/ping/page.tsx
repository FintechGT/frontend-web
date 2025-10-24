// src/app/debug/ping/page.tsx
"use client";

import * as React from "react";
import api from "@/lib/api";

/** Extrae un mensaje legible desde un error desconocido (axios o genérico) */
function humanizeError(err: unknown, fallback = "Error desconocido"): string {
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;

  // Intentar forma axios: { response: { status?: number; data?: { detail?: string } } }
  if (err && typeof err === "object") {
    const resp = (err as { response?: { status?: number; data?: unknown } }).response;
    const status = resp?.status;

    // Buscar "detail" si existe en data
    const data = resp?.data;
    if (data && typeof data === "object") {
      const maybeDetail =
        "detail" in (data as Record<string, unknown>)
          ? (data as { detail?: unknown }).detail
          : undefined;
      if (typeof maybeDetail === "string" && maybeDetail.trim()) return maybeDetail;
    }

    // Si no hubo "detail", devolver algo con el status si existe
    if (typeof status === "number") return `Error HTTP ${status}`;
  }

  return fallback;
}

export default function DebugPingPage(): React.ReactElement {
  const [base] = React.useState<string>(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  );

  const [rootOk, setRootOk] = React.useState<unknown | null>(null);
  const [rootErr, setRootErr] = React.useState<string | null>(null);

  const [misOk, setMisOk] = React.useState<unknown | null>(null);
  const [misErr, setMisErr] = React.useState<string | null>(null);

  const [loadingRoot, setLoadingRoot] = React.useState(false);
  const [loadingMis, setLoadingMis] = React.useState(false);

  async function testRoot(): Promise<void> {
    setLoadingRoot(true);
    setRootOk(null);
    setRootErr(null);
    try {
      const res = await api.get("/");
      setRootOk(res.data);
    } catch (e: unknown) {
      setRootErr(humanizeError(e, "Error al probar /"));
    } finally {
      setLoadingRoot(false);
    }
  }

  async function testMisContratos(): Promise<void> {
    setLoadingMis(true);
    setMisOk(null);
    setMisErr(null);
    try {
      const res = await api.get("/contratos/mis");
      setMisOk(res.data);
    } catch (e: unknown) {
      // Leer status si viene de axios
      const resp = (e as { response?: { status?: number; data?: unknown } }).response;
      const st = resp?.status;

      if (st === 401) {
        setMisErr("401 No autorizado: inicia sesión y vuelve a intentar.");
      } else if (st === 403) {
        setMisErr("403 Prohibido: tu usuario no tiene permiso.");
      } else {
        setMisErr(humanizeError(e, "Error al probar /contratos/mis"));
      }
    } finally {
      setLoadingMis(false);
    }
  }

  React.useEffect(() => {
    void testRoot();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Ping API</h1>

      <div className="rounded-xl border border-white/10 p-4">
        <div className="text-sm text-neutral-400">BASE:</div>
        <div className="break-all font-mono text-blue-300">{base}</div>
      </div>

      {/* Test raíz / */}
      <div className="space-y-3 rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">GET / (raíz)</h2>
          <button
            onClick={testRoot}
            disabled={loadingRoot}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            {loadingRoot ? "Probando..." : "Reintentar"}
          </button>
        </div>

        {rootOk !== null && (
          <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-xs">
            {JSON.stringify(rootOk, null, 2)}
          </pre>
        )}
        {rootErr && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {rootErr}
          </div>
        )}
      </div>

      {/* Test /contratos/mis */}
      <div className="space-y-3 rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">GET /contratos/mis (requiere login)</h2>
          <button
            onClick={testMisContratos}
            disabled={loadingMis}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            {loadingMis ? "Probando..." : "Probar"}
          </button>
        </div>

        {misOk !== null && (
          <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-xs">
            {JSON.stringify(misOk, null, 2)}
          </pre>
        )}
        {misErr && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {misErr}
          </div>
        )}
        <p className="text-xs text-neutral-400">
          Nota: si obtienes 401, asegúrate de haber iniciado sesión y que el
          token esté en <code>localStorage</code> como <code>access_token</code> o{" "}
          <code>token</code>.
        </p>
      </div>
    </div>
  );
}
