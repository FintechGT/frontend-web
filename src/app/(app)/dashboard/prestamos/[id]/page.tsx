"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, ShieldCheck, RefreshCw } from "lucide-react";
import { listarPagosDePrestamo, crearPago, validarPago } from "../../../../services/pagos";
import api from "@/lib/api";

type RolCodigo = "ADMINISTRADOR" | "CAJERO" | "SUPERVISOR" | "COBRADOR" | "INVITADO" | "VALUADOR" | string;

function canValidarPago(roles: RolCodigo[]) {
  const req = ["ADMINISTRADOR", "CAJERO", "SUPERVISOR"];
  const r = new Set(roles.map((x) => x.toUpperCase()));
  return req.some((x) => r.has(x));
}

const PENDIENTE_ID = 1; // 👈 ajusta según tu catálogo

export default function PrestamoDetallePage() {
  const params = useParams<{ id: string }>();
  const idPrestamo = useMemo(() => Number(params?.id), [params?.id]);

  const [roles, setRoles] = useState<RolCodigo[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Form crear pago
  const [monto, setMonto] = useState("");
  const [medio, setMedio] = useState("efectivo");
  const [refb, setRefb] = useState("");
  const [comprobante, setComprobante] = useState("");

  async function cargarRoles() {
    try {
      const { data } = await api.get<string[]>("/seguridad/mis-roles");
      setRoles((data || []).map((x: any) => String(x).toUpperCase()));
    } catch {}
  }

  async function cargarPagos() {
    setLoading(true);
    setErr(null);
    try {
      const data = await listarPagosDePrestamo(idPrestamo, { limit: 200, offset: 0 });
      setPagos(data.items || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setErr(e?.message || "Error al cargar pagos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(idPrestamo)) return;
    void cargarRoles();
    void cargarPagos();
  }, [idPrestamo]);

  async function onCrearPago(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const nMonto = Number(monto);
    if (!Number.isFinite(nMonto) || nMonto <= 0) {
      setErr("Ingresa un monto válido.");
      return;
    }
    try {
      await crearPago({
        id_prestamo: idPrestamo,
        monto: nMonto,
        medio_pago: medio,
        ref_bancaria: refb || undefined,
        comprobante_url: comprobante || undefined,
      });
      setMonto("");
      setRefb("");
      setComprobante("");
      await cargarPagos();
      alert("Pago creado en estado pendiente.");
    } catch (e: any) {
      setErr(e?.message || "No se pudo crear el pago.");
    }
  }

  async function onValidar(id_pago: number) {
    if (!canValidarPago(roles)) {
      alert("No tienes permisos para validar pagos.");
      return;
    }
    if (!confirm(`¿Validar el pago #${id_pago}?`)) return;
    try {
      const res = await validarPago(id_pago, "Validado desde UI");
      await cargarPagos();
      alert(`Pago validado. Estado del préstamo: ${res.prestamo.estado}`);
    } catch (e: any) {
      alert(e?.message || "No se pudo validar.");
    }
  }

  if (!Number.isFinite(idPrestamo)) {
    return <div className="p-6 text-red-300">ID de préstamo inválido.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/prestamos" className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
            ← Volver
          </Link>
          <h1 className="text-xl font-semibold">Préstamo #{idPrestamo}</h1>
        </div>
        <button
          onClick={() => void cargarPagos()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <RefreshCw className="size-4" /> Actualizar
        </button>
      </div>

      {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>}

      {/* Crear pago pendiente */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm text-neutral-300">
          <Plus className="size-4" /> Registrar pago pendiente
        </div>
        <form onSubmit={onCrearPago} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Monto (Q)</span>
            <input
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              type="number"
              min={0.01}
              step={0.01}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Medio</span>
            <select
              value={medio}
              onChange={(e) => setMedio(e.target.value)}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="efectivo">efectivo</option>
              <option value="transferencia">transferencia</option>
              <option value="tarjeta">tarjeta</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">Referencia bancaria (opcional)</span>
            <input
              value={refb}
              onChange={(e) => setRefb(e.target.value)}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="TRANS-123"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-300">URL comprobante (opcional)</span>
            <input
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="https://..."
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500">
              <Loader2 className="size-4 hidden data-[loading=true]:inline animate-spin" data-loading={false} />
              Crear pago
            </button>
          </div>
        </form>
      </div>

      {/* Listado de pagos */}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-neutral-400">
          <div className="col-span-2">Pago</div>
          <div className="col-span-2">Fecha</div>
          <div className="col-span-2">Monto</div>
          <div className="col-span-2">Medio</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2">Acciones</div>
        </div>

        {loading ? (
          <div className="grid place-items-center p-10 text-neutral-400">
            <Loader2 className="mr-2 size-6 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {pagos.map((p) => (
              <div key={p.id_pago} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-2 font-medium">#{p.id_pago}</div>
                <div className="col-span-2 font-mono text-xs">{p.fecha_pago ?? "—"}</div>
                <div className="col-span-2">Q {Number(p.monto ?? 0).toLocaleString()}</div>
                <div className="col-span-2">{p.medio_pago || "—"}</div>
                <div className="col-span-2">{p.id_estado}</div>
                <div className="col-span-2 flex gap-2">
                  {p.comprobantes?.[0]?.url && (
                    <a
                      href={p.comprobantes[0].url}
                      target="_blank"
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-blue-300 hover:bg-white/5"
                    >
                      Ver comprobante
                    </a>
                  )}
                  {p.id_estado === PENDIENTE_ID && canValidarPago(roles) && (
                    <button
                      onClick={() => onValidar(p.id_pago)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500"
                      title="Validar pago"
                    >
                      <ShieldCheck className="size-3" /> Validar
                    </button>
                  )}
                </div>
              </div>
            ))}

            {pagos.length === 0 && <div className="p-6 text-center text-neutral-400">Este préstamo aún no tiene pagos.</div>}
          </div>
        )}
      </div>

      <div className="text-xs text-neutral-400">Total registros: {total}</div>
    </div>
  );
}
