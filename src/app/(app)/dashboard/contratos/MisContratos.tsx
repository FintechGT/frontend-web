// src/app/(app)/dashboard/contratos/MisContratos.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { misContratos, Contrato } from "@/app/services/contratos";
import { FileText, Download, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

export default function MisContratos() {
  const [rows, setRows] = React.useState<Contrato[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await misContratos();
        if (!alive) return;
        setRows(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Error al cargar mis contratos");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="mr-2 size-6 animate-spin text-blue-400" />
        <span className="text-neutral-400">Cargando contratos…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mis Contratos</h1>
        <p className="text-sm text-neutral-400">Contratos de préstamos generados para ti</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <FileText className="mx-auto size-12 text-neutral-600" />
          <h3 className="mt-4 font-medium text-neutral-300">No tienes contratos</h3>
          <p className="mt-1 text-sm text-neutral-400">Aparecerán cuando un préstamo sea aprobado.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((c) => {
            const firmaCliente = Boolean(c.firma_cliente_en);
            const firmaEmpresa = Boolean(c.firma_empresa_en);
            const completo = firmaCliente && firmaEmpresa;
            const parcial = !completo && (firmaCliente || firmaEmpresa);

            return (
              <div key={c.id_contrato} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 place-items-center rounded-lg bg-blue-500/20">
                      <FileText className="size-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Contrato #{c.id_contrato}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                            completo
                              ? "bg-emerald-500/15 text-emerald-400"
                              : parcial
                              ? "bg-yellow-500/15 text-yellow-400"
                              : "bg-neutral-500/15 text-neutral-400"
                          }`}
                        >
                          {completo ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                          {completo ? "Completado" : parcial ? "Parcial" : "Pendiente"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-neutral-400">
                        Préstamo: <span className="text-neutral-300">#{c.id_prestamo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={c.url_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                    >
                      <Download className="size-4" />
                      PDF
                    </a>
                    <Link
                      href={`/dashboard/contratos/${c.id_contrato}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
                    >
                      Ver Detalle
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
