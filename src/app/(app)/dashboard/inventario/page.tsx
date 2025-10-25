"use client";

import * as React from "react";
import Image from "next/image";
import {
  listArticulosPublicos,
  type ArticuloPublicoListItem,
  type ArticuloPublicoListResponse,
} from "@/app/services/inventario";

type EstadoOpcion = { value: string; label: string };
const ESTADOS: EstadoOpcion[] = [
  { value: "", label: "— Todos —" },
  { value: "en_venta", label: "En venta" },
  { value: "disponible", label: "Disponible" },
  { value: "en_inventario", label: "En inventario" },
  { value: "vendido", label: "Vendido" },
];

const PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#444' font-size='20'>Sin imagen</text></svg>`
  );

function clsx(...xs: Array<string | false | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

function estadoBadge(estado: string): string {
  const e = estado.toLowerCase();
  if (e === "en_venta") return "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-600/30";
  if (e === "disponible") return "bg-sky-600/20 text-sky-300 ring-1 ring-sky-600/30";
  if (e === "en_inventario") return "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-600/30";
  if (e === "vendido") return "bg-rose-600/20 text-rose-300 ring-1 ring-rose-600/30";
  return "bg-zinc-700/40 text-zinc-300 ring-1 ring-zinc-600/40";
}

export default function InventarioCardsPage() {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<ArticuloPublicoListItem[]>([]);
  const [total, setTotal] = React.useState(0);

  // filtros
  const [q, setQ] = React.useState<string>("");
  const [estado, setEstado] = React.useState<string>("");
  const [idTipo, setIdTipo] = React.useState<number | "">("");
  const [soloEnVenta, setSoloEnVenta] = React.useState<boolean>(false);

  // paginación
  const [limit, setLimit] = React.useState<number>(12);
  const [offset, setOffset] = React.useState<number>(0);

  async function cargar() {
    setLoading(true);
    try {
      const res: ArticuloPublicoListResponse = await listArticulosPublicos({
        q: q || null,
        estado: estado || null,
        id_tipo: idTipo === "" ? null : Number(idTipo),
        solo_en_venta: soloEnVenta ? true : null,
        limit,
        offset,
      });
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onBuscar(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    cargar();
  }

  function nextPage() {
    if (offset + limit < total) {
      setOffset((o) => o + limit);
      setTimeout(cargar, 0);
    }
  }
  function prevPage() {
    if (offset > 0) {
      setOffset((o) => Math.max(0, o - limit));
      setTimeout(cargar, 0);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>

      {/* Filtros */}
      <form onSubmit={onBuscar} className="grid md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1 text-zinc-300">Buscar</label>
          <input
            className="w-full rounded-xl px-3 py-2 bg-zinc-900 border border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-600"
            placeholder="Descripción..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-zinc-300">Estado</label>
          <select
            className="w-full rounded-xl px-3 py-2 bg-zinc-900 border border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-600"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            {ESTADOS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-zinc-300">Categoría (id_tipo)</label>
          <input
            type="number"
            className="w-full rounded-xl px-3 py-2 bg-zinc-900 border border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-600"
            placeholder="Ej. 2"
            value={idTipo}
            onChange={(e) => setIdTipo(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="soloEnVenta"
            type="checkbox"
            className="h-4 w-4 accent-zinc-600"
            checked={soloEnVenta}
            onChange={(e) => setSoloEnVenta(e.target.checked)}
          />
          <label htmlFor="soloEnVenta" className="text-sm text-zinc-300">
            Solo en venta
          </label>
        </div>

        <div className="md:col-span-5 flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-zinc-100 text-black font-medium hover:bg-white/90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Cargando..." : "Buscar"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
            onClick={() => {
              setQ("");
              setEstado("");
              setIdTipo("");
              setSoloEnVenta(false);
              setOffset(0);
              setLimit(12);
              setTimeout(cargar, 0);
            }}
          >
            Limpiar
          </button>
        </div>
      </form>

      {/* Grid de tarjetas */}
      <div
        className={clsx(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}
      >
        {(loading && items.length === 0 ? Array.from({ length: 8 }) : items).map((it, idx) => {
          const isSkeleton = loading && items.length === 0;
          const foto = isSkeleton
            ? PLACEHOLDER
            : (it as ArticuloPublicoListItem).fotos?.[0] || PLACEHOLDER;

          return (
            <div
              key={isSkeleton ? `sk-${idx}` : (it as ArticuloPublicoListItem).id_articulo}
              className="group relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 shadow-lg shadow-black/30"
            >
              {/* Imagen */}
              <div className="relative w-full aspect-[4/3] bg-black">

                {!isSkeleton && (
                  <span
                    className={clsx(
                      "absolute left-3 top-3 px-2 py-1 text-[11px] rounded-full",
                      estadoBadge((it as ArticuloPublicoListItem).estado)
                    )}
                  >
                    {(it as ArticuloPublicoListItem).estado}
                  </span>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-400">
                    {(isSkeleton ? "—" : (it as ArticuloPublicoListItem).tipo_nombre) || "N/A"}
                  </span>
                  {!isSkeleton && (it as ArticuloPublicoListItem).disponible_compra && (
                    <span className="text-xs text-emerald-300">Disponible</span>
                  )}
                </div>

                <h3 className="text-base font-medium line-clamp-2 text-zinc-100">
                  {isSkeleton ? "Cargando…" : (it as ArticuloPublicoListItem).descripcion}
                </h3>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-400">
                    Valor est.:{" "}
                    {!isSkeleton
                      ? (it as ArticuloPublicoListItem).valor_estimado.toFixed(2)
                      : "—"}
                  </div>
                  <div className="text-sm">
                    {isSkeleton
                      ? "—"
                      : (it as ArticuloPublicoListItem).precio_venta != null
                      ? `Q ${(it as ArticuloPublicoListItem).precio_venta!.toFixed(2)}`
                      : "Sin precio"}
                  </div>
                </div>

                <button
                  disabled={isSkeleton}
                  className={clsx(
                    "w-full mt-1 rounded-xl px-3 py-2 text-sm font-medium",
                    "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:opacity-40"
                  )}
                  onClick={() => {
                    // aquí puedes navegar al detalle si ya tienes la página
                    // router.push(`/dashboard/inventario/${(it as ArticuloPublicoListItem).id_articulo}`)
                  }}
                >
                  Ver detalle
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">
          {items.length > 0
            ? `Mostrando ${offset + 1}–${Math.min(offset + limit, total)} de ${total}`
            : `Total: ${total}`}
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
            onClick={prevPage}
            disabled={offset === 0 || loading}
          >
            « Anterior
          </button>
          <button
            className="px-3 py-1 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
            onClick={nextPage}
            disabled={offset + limit >= total || loading}
          >
            Siguiente »
          </button>
          <select
            className="border border-zinc-700 bg-zinc-900 text-zinc-200 rounded-xl px-2 py-1"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setOffset(0);
              setTimeout(cargar, 0);
            }}
          >
            {[12, 24, 48].map((n) => (
              <option key={n} value={n}>
                {n}/página
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
