"use client";

import * as React from "react";
import Link from "next/link";
import { listMisSolicitudes, type Solicitud } from "@/app/services/solicitudes";
import { Search } from "lucide-react";

const ESTADOS = ["pendiente", "aprobada", "rechazada", "cancelada"] as const;

export default function SolicitudesPage() {
  const [items, setItems] = React.useState<Solicitud[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // filtros UI
  const [q, setQ] = React.useState("");
  const [estado, setEstado] = React.useState<string>("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await listMisSolicitudes();
        if (!alive) return;
        const sorted = (data ?? []).slice().sort((a, b) => {
          const da = (a.created_at || a.fecha_envio || "")!;
          const db = (b.created_at || b.fecha_envio || "")!;
          return da < db ? 1 : da > db ? -1 : 0;
        });
        setItems(sorted);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "No se pudo cargar");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = React.useMemo(() => {
    return items.filter((s) => {
      const byEstado = estado ? (s.estado ?? "").toLowerCase() === estado : true;
      const byQ =
        q.trim() === ""
          ? true
          : [
              String(s.id_solicitud),
              s.codigo ?? "",
              (s.articulos?.[0]?.descripcion ?? ""),
            ]
              .join(" ")
              .toLowerCase()
              .includes(q.toLowerCase());
      return byEstado && byQ;
    });
  }, [items, q, estado]);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solicitudes</h1>
          <p className="text-sm text-neutral-400">
            Lista y filtros de tus solicitudes.
          </p>
        </div>
        <Link
          href="/dashboard/solicitudes/nueva"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Crear solicitud
        </Link>
      </div>

      {/* filtros */}
      <div className="grid gap-3 sm:grid-cols-[1fr_240px_120px]">
        <label className="relative">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por #, código o descripción…"
            className="w-full rounded-xl bg-neutral-900 border border-white/10 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <button
          onClick={() => { setQ(""); setEstado(""); }}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          Limpiar
        </button>
      </div>

      {/* tabla */}
      <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <header className="grid grid-cols-12 gap-2 px-4 py-2 text-sm text-neutral-400">
          <div className="col-span-4 sm:col-span-3">Solicitud</div>
          <div className="col-span-3 sm:col-span-2">Código</div>
          <div className="col-span-3 sm:col-span-3">Estado</div>
          <div className="col-span-2 text-right sm:text-left sm:col-span-2">Art.</div>
          <div className="hidden sm:block sm:col-span-2">Fecha</div>
        </header>

        {loading && <div className="px-4 py-6 text-neutral-400">Cargando…</div>}
        {error && !loading && <div className="px-4 py-6 text-red-400">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="px-4 py-6 text-neutral-400">Sin resultados.</div>
        )}

        <div className="divide-y divide-white/10 text-sm">
          {!loading && !error && filtered.map((s) => (
            <article key={s.id_solicitud} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-white/5">
              <div className="col-span-4 sm:col-span-3">
                <Link href={`/dashboard/solicitudes/${s.id_solicitud}`} className="font-medium hover:underline">
                  #{s.id_solicitud}
                </Link>
              </div>
              <div className="col-span-3 sm:col-span-2">{s.codigo ?? "—"}</div>
              <div className="col-span-3 sm:col-span-3">
                <EstadoBadge value={s.estado} />
              </div>
              <div className="col-span-2 text-right sm:text-left sm:col-span-2">
                {s.articulos?.length ?? 0}
              </div>
              <div className="hidden sm:block sm:col-span-2">
                {(s.created_at || s.fecha_envio || s.fecha_vencimiento || "—").slice(0,10)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function EstadoBadge({ value }: { value?: string }) {
  const v = (value ?? "—").toLowerCase();
  const cls =
    v === "aprobada"
      ? "bg-emerald-600/20 text-emerald-300 border-emerald-600/30"
      : v === "rechazada" || v === "cancelada"
      ? "bg-red-600/20 text-red-300 border-red-600/30"
      : "bg-amber-600/20 text-amber-300 border-amber-600/30";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${cls}`}>{v}</span>
  );
}
