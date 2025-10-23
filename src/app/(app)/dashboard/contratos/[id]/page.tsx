// src/app/(app)/dashboard/contratos/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Shield,
  Loader2,
  AlertCircle,
  PenTool,
  Info,
  Copy,
} from "lucide-react";
import { useAuth } from "@/app/AppLayoutClient";
import FirmaPad from "@/components/FirmaPad";
import {
  obtenerContrato,
  firmarContrato,
  firmarCriptograficamente,
  urlAbrirContrato,
  urlVerContrato,
  type ContratoDetalle,
} from "@/app/services/contratos";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Error desconocido";
}

export default function ContratoDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idContrato = Number(params?.id);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [contrato, setContrato] = React.useState<ContratoDetalle | null>(null);
  const [showFirmaPad, setShowFirmaPad] = React.useState(false);
  const [firmando, setFirmando] = React.useState(false);
  const [tipoFirma, setTipoFirma] = React.useState<"cliente" | "empresa" | null>(null);

  // Roles del usuario autenticado
  const { roles } = useAuth();
  const puedeFirmarEmpresa = React.useMemo(
    () => roles.some((r) => ["ADMINISTRADOR", "VALUADOR"].includes(r.toUpperCase())),
    [roles]
  );

  const cargarContrato = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerContrato(idContrato);
      setContrato(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [idContrato]);

  React.useEffect(() => {
    if (Number.isFinite(idContrato)) {
      void cargarContrato();
    } else {
      setError("ID de contrato inválido");
      setLoading(false);
    }
  }, [idContrato, cargarContrato]);

  const handleIniciarFirma = (tipo: "cliente" | "empresa") => {
    setTipoFirma(tipo);
    setShowFirmaPad(true);
  };

  const handleGuardarFirma = async (dataUrl: string) => {
    if (!tipoFirma) return;
    try {
      setFirmando(true);
      const ip = "0.0.0.0"; // En prod, puedes registrar la IP real si te interesa
      const response = await firmarContrato(idContrato, {
        firmante: tipoFirma,
        firma_digital: dataUrl,
        ip,
      });
      toast.success(
        response.contrato_completado
          ? "¡Contrato firmado completamente! El préstamo queda activo."
          : `Firma de ${tipoFirma} registrada`
      );
      setShowFirmaPad(false);
      await cargarContrato();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setFirmando(false);
    }
  };

  const handleFirmarCripto = async () => {
    try {
      setFirmando(true);
      await firmarCriptograficamente(idContrato);
      toast.success("Contrato firmado criptográficamente");
      await cargarContrato();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setFirmando(false);
    }
  };

  const copiarHash = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast.success("Hash copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-blue-400" />
          <p className="mt-3 text-sm text-neutral-400">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contrato) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-400" />
            <div>
              <div className="font-medium text-red-400">Error al cargar</div>
              <div className="mt-1 text-sm text-red-300">{error || "No se pudo cargar el contrato"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const firmaClienteCompleta = Boolean(contrato.firma_cliente_en);
  const firmaEmpresaCompleta = Boolean(contrato.firma_empresa_en);
  const contratoCompletado = firmaClienteCompleta && firmaEmpresaCompleta;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <ArrowLeft className="size-4" />
            Volver
          </button>
          <h1 className="text-xl font-semibold">Contrato #{contrato.id_contrato}</h1>
        </div>

        <div className="flex items-center gap-2">
          {contratoCompletado ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
              <CheckCircle2 className="size-3" />
              Completado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-3 py-1 text-xs text-yellow-400">
              <Clock className="size-3" />
              Pendiente
            </span>
          )}
        </div>
      </div>

      {/* Información del Contrato */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="size-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Información del Contrato</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm text-neutral-400">ID Préstamo</div>
            <div className="mt-1 font-medium">#{contrato.id_prestamo}</div>
          </div>

          <div>
            <div className="text-sm text-neutral-400">Hash del Documento</div>
            <div className="mt-1 flex items-center gap-2 font-mono text-xs">
              {(contrato.hash_doc || "").slice(0, 16)}...
              {contrato.hash_doc && (
                <button
                  className="rounded-md border border-white/10 px-2 py-1 text-[11px] hover:bg-white/10"
                  onClick={() => copiarHash(contrato.hash_doc!)}
                  title="Copiar hash"
                >
                  <Copy className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm text-neutral-400">Creado</div>
            <div className="mt-1">
              {contrato.created_at ? new Date(contrato.created_at).toLocaleString("es") : "—"}
            </div>
          </div>

          <div>
            <div className="text-sm text-neutral-400">Actualizado</div>
            <div className="mt-1">
              {contrato.updated_at ? new Date(contrato.updated_at).toLocaleString("es") : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del Préstamo */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Info className="size-5 text-purple-400" />
          <h2 className="text-lg font-semibold">Resumen del Préstamo</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-neutral-400">Artículo</div>
            <div className="mt-1">{contrato.prestamo.articulo?.descripcion ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Estado</div>
            <div className="mt-1">{contrato.prestamo.estado?.nombre ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Monto</div>
            <div className="mt-1 font-medium">
              Q{" "}
              {Number(contrato.prestamo.monto_prestamo ?? 0).toLocaleString("es-GT", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Inicio</div>
            <div className="mt-1">{contrato.prestamo.fecha_inicio ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Vencimiento</div>
            <div className="mt-1">{contrato.prestamo.fecha_vencimiento ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Deuda actual</div>
            <div className="mt-1">
              Q{" "}
              {Number(contrato.prestamo.deuda_actual ?? 0).toLocaleString("es-GT", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Interés acumulado</div>
            <div className="mt-1">
              Q{" "}
              {Number(contrato.prestamo.interes_acumulada ?? 0).toLocaleString("es-GT", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">Mora acumulada</div>
            <div className="mt-1">
              Q{" "}
              {Number(contrato.prestamo.mora_acumulada ?? 0).toLocaleString("es-GT", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PDF */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Documento PDF</h2>
          <a
            href={urlAbrirContrato(contrato.id_contrato)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          >
            <Download className="size-4" />
            Descargar / Abrir
          </a>
        </div>

        <div className="aspect-[8.5/11] overflow-hidden rounded-lg border border-white/10 bg-white">
          <iframe
            src={urlVerContrato(contrato.id_contrato)}
            className="h-full w-full"
            title="Vista previa del contrato"
          />
        </div>
      </div>

      {/* Estado de firmas */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Cliente */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <PenTool className="size-4 text-blue-400" />
            <h3 className="font-semibold">Firma del Cliente</h3>
          </div>
          {firmaClienteCompleta ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-4" />
                <span className="text-sm">Firmado</span>
              </div>
              <div className="text-xs text-neutral-400">
                {new Date(contrato.firma_cliente_en!).toLocaleString("es")}
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleIniciarFirma("cliente")}
              disabled={firmando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              <PenTool className="size-4" />
              Firmar como Cliente
            </button>
          )}
        </div>

        {/* Empresa */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="size-4 text-purple-400" />
            <h3 className="font-semibold">Firma de la Empresa</h3>
          </div>

          {firmaEmpresaCompleta ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-4" />
                <span className="text-sm">Firmado</span>
              </div>
              <div className="text-xs text-neutral-400">
                {new Date(contrato.firma_empresa_en!).toLocaleString("es")}
              </div>
            </div>
          ) : puedeFirmarEmpresa ? (
            <div className="space-y-2">
              <button
                onClick={() => handleIniciarFirma("empresa")}
                disabled={firmando || !firmaClienteCompleta}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500 disabled:opacity-50"
                title={!firmaClienteCompleta ? "Primero debe firmar el cliente" : ""}
              >
                <Shield className="size-4" />
                Firmar como Empresa
              </button>
              {!firmaClienteCompleta && (
                <p className="text-xs text-yellow-400">Primero debe firmar el cliente.</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-400">
              Solo personal <span className="font-medium">ADMINISTRADOR</span> o{" "}
              <span className="font-medium">VALUADOR</span> puede firmar en nombre de la empresa.
            </p>
          )}
        </div>
      </div>

      {/* Firma criptográfica (opcional) */}
      {contratoCompletado && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="size-5 text-blue-400" />
            <h3 className="font-semibold text-blue-400">Firma Criptográfica (Opcional)</h3>
          </div>
          <p className="mb-4 text-sm text-neutral-300">
            Puedes agregar una firma digital criptográfica con certificado X.509 para mayor seguridad.
          </p>
          <button
            onClick={handleFirmarCripto}
            disabled={firmando}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
          >
            <Shield className="size-4" />
            Firmar Criptográficamente
          </button>
        </div>
      )}

      {/* Modal de firma */}
      {showFirmaPad && <FirmaPad onSave={handleGuardarFirma} onCancel={() => setShowFirmaPad(false)} />}
    </div>
  );
}
