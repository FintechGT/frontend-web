// src/lib/cuotas.ts

export type PrestamoLike = {
  id_prestamo: number;
  monto_prestamo: number | string | null;
  fecha_inicio: string;        // "YYYY-MM-DD" o ISO
  fecha_vencimiento: string;   // "YYYY-MM-DD" o ISO
  deuda_actual?: number | string | null;
};

// ⚠️ Constantes del producto (puedes moverlas a .env.local)
const TASA_INTERES_DIARIO = 0.0005; // 0.05% diario
const TASA_MORA_DIARIA    = 0.0010; // 0.10% diario
const GRACIA_DIAS         = 3;      // días de gracia

const MS_PER_DAY = 24 * 3600 * 1000;

function parseDate(d: string): Date {
  // Acepta "YYYY-MM-DD" o ISO; evita TZ shift tomando solo la parte de fecha
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7));
  const day = Number(d.slice(8, 10));
  if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(day)) {
    return new Date(y, (m || 1) - 1, day || 1);
  }
  // Fallback a constructor estándar (por si viene ISO completo)
  const dt = new Date(d);
  // Normalizar a fecha (sin hora) para cálculos por día
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const ms =
    Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  // floor para evitar redondeos sorpresivos
  return Math.floor(ms / MS_PER_DAY);
}

function monthsBetween(a: Date, b: Date): number {
  const base = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  // si el día de b es mayor que el de a, contamos un mes adicional (aprox francés)
  return base + (b.getDate() > a.getDate() ? 1 : 0);
}

export type CalculoCuota = {
  modo: "diaria" | "mensual";
  dias_prestamo: number;
  n_meses: number;
  tasa_interes_diaria: number;
  tasa_mora_diaria: number;
  gracia_dias: number;
  cuota_sugerida: number;      // valor principal a mostrar
  interes_total_estimado: number;
  mora_estimativa: number;
  detalle?: {
    cuota_fija?: number;       // si es mensual (francés)
  };
};

export function calcularCuotaCliente(
  p: PrestamoLike,
  _hoy: Date = new Date() // subrayado para evitar warning por no uso
): CalculoCuota {
  const monto = Number(p.monto_prestamo ?? 0);
  const fi = parseDate(p.fecha_inicio);
  const fv = parseDate(p.fecha_vencimiento);

  const diasPrestamo = Math.max(1, daysBetween(fi, fv));
  const modo: "diaria" | "mensual" = diasPrestamo < 30 ? "diaria" : "mensual";

  if (modo === "diaria") {
    // Interés sobre el período completo para una cuota promedio
    const interes = monto * TASA_INTERES_DIARIO * diasPrestamo;
    const cuotaProm = (monto + interes) / diasPrestamo;

    // Mora estimada como referencia (solo por días de gracia)
    const moraEstim = monto * TASA_MORA_DIARIA * Math.max(0, GRACIA_DIAS);

    return {
      modo,
      dias_prestamo: diasPrestamo,
      n_meses: 0,
      tasa_interes_diaria: TASA_INTERES_DIARIO,
      tasa_mora_diaria: TASA_MORA_DIARIA,
      gracia_dias: GRACIA_DIAS,
      cuota_sugerida: round2(cuotaProm),
      interes_total_estimado: round2(interes),
      mora_estimativa: round2(moraEstim),
    };
  } else {
    // Amortización francesa (mensual)
    const n = Math.max(1, monthsBetween(fi, fv));
    const r = Math.pow(1 + TASA_INTERES_DIARIO, 30) - 1; // equivalente mensual aprox
    const cuotaFija = (monto * r) / (1 - Math.pow(1 + r, -n));
    const interesTotal = cuotaFija * n - monto;
    const moraEstim = monto * TASA_MORA_DIARIA * Math.max(0, GRACIA_DIAS);

    return {
      modo,
      dias_prestamo: diasPrestamo,
      n_meses: n,
      tasa_interes_diaria: TASA_INTERES_DIARIO,
      tasa_mora_diaria: TASA_MORA_DIARIA,
      gracia_dias: GRACIA_DIAS,
      cuota_sugerida: round2(cuotaFija),
      interes_total_estimado: round2(interesTotal),
      mora_estimativa: round2(moraEstim),
      detalle: { cuota_fija: round2(cuotaFija) },
    };
  }
}

function round2(x: number): number {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}
