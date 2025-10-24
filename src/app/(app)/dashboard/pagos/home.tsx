"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PagosHome() {
  const sp = useSearchParams();
  const prestamo = sp.get("prestamo");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pagos</h1>
        <Link
          href="/dashboard/prestamos"
          className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          Ir a Préstamos
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
        {prestamo ? (
          <div>
            Estás viendo la sección de pagos para el préstamo <b>#{prestamo}</b>.{" "}
            Entra a{" "}
            <Link
              href={`/dashboard/prestamos/${prestamo}`}
              className="text-blue-400 underline"
            >
              su detalle
            </Link>{" "}
            para ver o validar pagos.
          </div>
        ) : (
          <div>
            Esta sección listará pagos globales más adelante. De momento, navega
            desde{" "}
            <Link
              href="/dashboard/prestamos"
              className="text-blue-400 underline"
            >
              Préstamos
            </Link>{" "}
            y usa el botón <b>Ver</b>.
          </div>
        )}
      </div>
    </div>
  );
}
