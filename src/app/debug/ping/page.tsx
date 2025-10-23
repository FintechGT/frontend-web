"use client";

import * as React from "react";
import api from "@/lib/api";

type Json = Record<string, any>;

export default function DebugPingPage() {
  const [base] = React.useState<string>(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  );

  const [rootOk, setRootOk] = React.useState<null | Json>(null);
  const [rootErr, setRootErr] = React.useState<string | null>(null);

  const [misOk, setMisOk] = React.useState<null | Json>(null);
  const [misErr, setMisErr] = React.useState<string | null>(null);

  const [loadingRoot, setLoadingRoot] = React.useState(false);
  const [loadingMis, setLoadingMis] = React.useState(false);

  async function testRoot() {
    setLoadingRoot(true);
    setRootOk(null);
    setRootErr(null);
    try {
      // ✅ usa "/" que tu backend sí expone
      const res = await api.get("/");
      setRootOk(res.data);
    } catch (e: any) {
      setRootErr(
        e?.response?.data?.detail ||
          e?.message ||
          "Error desconocido al probar /"
      );
    } finally {
      setLoadingRoot(false);
    }
  }

  async function testMisContratos() {
    setLoadingMis(true);
    setMisOk(null);
    setMisErr(null);
    try {
      // ✅ endpoint protegido para verificar token
      const res = await api.get("/contratos/mis");
      setMisOk(res.data);
    } catch (e: any) {
      const st = e?.response?.status;
      if (st === 401) {
        setMisErr("401 No autorizado: inicia sesión y vuelve a intentar.");
      } else if (st === 403) {
        setMisErr("403 Prohibido: tu usuario no tiene permiso.");
      } else {
        setMisErr(
          e?.response?.data?.detail ||
            e?.message ||
            "Error al probar /contratos/mis"
        );
      }
    } finally {
      setLoadingMis(false);
    }
  }

  React.useEffect(() => {
    // dispara automáticamente la prueba a /
    void testRoot();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Ping API</h1>

      <div className="rounded-xl border border-white/10 p-4">
        <div className="text-sm text-neutral-400">BASE:</div>
        <div className="font-mono text-blue-300 break-all">{base}</div>
      </div>

      {/* Test raíz / */}
      <div className="rounded-xl border border-white/10 p-4 space-y-3">
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

        {rootOk && (
          <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-xs">
            {JSON.stringify(rootOk, null, 2)}
          </pre>
        )}
        {rootErr && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm">
            {rootErr}
          </div>
        )}
      </div>

      {/* Test /contratos/mis */}
      <div className="rounded-xl border border-white/10 p-4 space-y-3">
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

        {misOk && (
          <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-xs">
            {JSON.stringify(misOk, null, 2)}
          </pre>
        )}
        {misErr && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm">
            {misErr}
          </div>
        )}
        <p className="text-xs text-neutral-400">
          Nota: si obtienes 401, asegúrate de haber iniciado sesión y que el
          token esté en <code>localStorage</code> como{" "}
          <code>access_token</code> o <code>token</code>.
        </p>
      </div>
    </div>
  );
}
