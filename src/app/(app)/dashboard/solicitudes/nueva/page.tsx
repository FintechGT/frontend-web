// src/app/(app)/dashboard/solicitudes/nueva/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadToCloudinary } from "@/app/services/cloudinary";
import {
  crearSolicitudCompleta,
  type NuevaSolicitudPayload,
} from "@/app/services/solicitudes";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";

type Metodo = "domicilio" | "oficina";
type Condicion = "nuevo" | "seminuevo" | "usado" | "malo";

type ArtForm = {
  id_tipo: number | "";
  descripcion: string;
  valor_estimado: string; // como texto en el form
  condicion: Condicion | "";
  files: File[]; // fotos locales a subir
  previews: string[];
};

export default function NuevaSolicitudPage() {
  const router = useRouter();

  const [metodo, setMetodo] = React.useState<Metodo>("domicilio");
  const [direccion, setDireccion] = React.useState<string>("");

  const [articulos, setArticulos] = React.useState<ArtForm[]>([
    { id_tipo: 1, descripcion: "", valor_estimado: "", condicion: "", files: [], previews: [] },
  ]);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addArticulo = () =>
    setArticulos((prev) => [
      ...prev,
      { id_tipo: 1, descripcion: "", valor_estimado: "", condicion: "", files: [], previews: [] },
    ]);

  const removeArticulo = (idx: number) =>
    setArticulos((prev) => prev.filter((_, i) => i !== idx));

  const onFiles = (idx: number, fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const previews = files.map((f) => URL.createObjectURL(f));
    setArticulos((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], files: [...copy[idx].files, ...files], previews: [...copy[idx].previews, ...previews] };
      return copy;
    });
  };

  const removeFoto = (aIdx: number, fIdx: number) => {
    setArticulos((prev) => {
      const copy = [...prev];
      const art = copy[aIdx];
      const newFiles = art.files.filter((_, i) => i !== fIdx);
      const newPrev = art.previews.filter((_, i) => i !== fIdx);
      copy[aIdx] = { ...art, files: newFiles, previews: newPrev };
      return copy;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validaciones rápidas UI
    if (metodo === "domicilio" && !direccion.trim()) {
      setError("La dirección es obligatoria para método domicilio.");
      return;
    }
    if (articulos.length === 0) {
      setError("Agrega al menos un artículo.");
      return;
    }
    for (const a of articulos) {
      if (!a.descripcion.trim()) return setError("Cada artículo requiere descripción.");
      const ve = Number(a.valor_estimado);
      if (!Number.isFinite(ve) || ve <= 0) return setError("Valor estimado debe ser mayor a 0.");
      if (!a.condicion) return setError("Selecciona una condición por artículo.");
      if (a.files.length === 0) return setError("Cada artículo debe incluir al menos una foto.");
    }

    setSubmitting(true);
    try {
      // 1) Subir fotos a Cloudinary
      const FOLDER = "pignoraticios/solicitudes";
      const articulosConUrls = [];
      for (const a of articulos) {
        const urls: string[] = [];
        let orden = 1;
        for (const f of a.files) {
          const url = await uploadToCloudinary(f, FOLDER);
          urls.push(url);
          orden++;
        }
        articulosConUrls.push({
          id_tipo: Number(a.id_tipo || 1),
          descripcion: a.descripcion.trim(),
          valor_estimado: Number(a.valor_estimado),
          condicion: a.condicion,
          fotos: urls.map((u, i) => ({ url: u, orden: i + 1 })),
        });
      }

      // 2) Armar payload y enviar al backend
      const payload: NuevaSolicitudPayload = {
        metodo_entrega: metodo,
        ...(metodo === "domicilio" ? { direccion_entrega: direccion.trim() } : {}),
        articulos: articulosConUrls,
      };

      const creada = await crearSolicitudCompleta(payload);

      // 3) Redirigir al detalle
      router.push(`/dashboard/solicitudes/${creada.id_solicitud}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/solicitudes"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
        <h1 className="text-xl font-semibold">Nueva solicitud</h1>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de la solicitud */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="font-medium">Datos de entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-neutral-300">Método</span>
              <select
                className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as Metodo)}
              >
                <option value="domicilio">Domicilio</option>
                <option value="oficina">Oficina</option>
              </select>
            </label>

            {metodo === "domicilio" && (
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-neutral-300">Dirección</span>
                <input
                  className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                  placeholder="Zona 1, Guatemala…"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </label>
            )}
          </div>
        </section>

        {/* Artículos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Artículos</h2>
            <button
              type="button"
              onClick={addArticulo}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500"
            >
              <Plus className="size-4" />
              Agregar artículo
            </button>
          </div>

          <ul className="grid gap-4">
            {articulos.map((a, idx) => (
              <li key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-neutral-400">Artículo #{idx + 1}</div>
                  {articulos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArticulo(idx)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                    >
                      <Trash2 className="size-4" />
                      Quitar
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">Tipo (catálogo)</span>
                    <input
                      type="number"
                      min={1}
                      className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                      value={a.id_tipo}
                      onChange={(e) =>
                        setArticulos((prev) => {
                          const copy = [...prev];
                          copy[idx].id_tipo = Number(e.target.value);
                          return copy;
                        })
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">Valor estimado (Q)</span>
                    <input
                      inputMode="decimal"
                      className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                      placeholder="1800"
                      value={a.valor_estimado}
                      onChange={(e) =>
                        setArticulos((prev) => {
                          const copy = [...prev];
                          copy[idx].valor_estimado = e.target.value;
                          return copy;
                        })
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-sm sm:col-span-2">
                    <span className="text-neutral-300">Descripción</span>
                    <input
                      className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                      placeholder="iPhone 12 128GB"
                      value={a.descripcion}
                      onChange={(e) =>
                        setArticulos((prev) => {
                          const copy = [...prev];
                          copy[idx].descripcion = e.target.value;
                          return copy;
                        })
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">Condición</span>
                    <select
                      className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                      value={a.condicion}
                      onChange={(e) =>
                        setArticulos((prev) => {
                          const copy = [...prev];
                          copy[idx].condicion = e.target.value as Condicion;
                          return copy;
                        })
                      }
                    >
                      <option value="">Selecciona…</option>
                      <option value="nuevo">Nuevo</option>
                      <option value="seminuevo">Seminuevo</option>
                      <option value="usado">Usado</option>
                      <option value="malo">Malo</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">Fotos</span>
                    <div className="flex items-center gap-2">
                      <input
                        id={`files-${idx}`}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => onFiles(idx, e.target.files)}
                      />
                      <label
                        htmlFor={`files-${idx}`}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                      >
                        <Upload className="size-4" />
                        Seleccionar
                      </label>
                      <span className="text-xs text-neutral-400">{a.files.length} archivo(s)</span>
                    </div>
                  </label>

                  {/* Previews (full width) */}
                  {a.previews.length > 0 && (
                    <div className="sm:col-span-2">
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {a.previews.map((src, i) => (
                          <div key={src} className="relative">
                            <img
                              src={src}
                              alt={`foto-${i + 1}`}
                              className="h-28 w-full rounded-xl object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeFoto(idx, i)}
                              className="absolute right-1 top-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px]"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
          >
            {submitting ? "Creando…" : "Crear solicitud"}
          </button>
          <Link
            href="/dashboard/solicitudes"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
