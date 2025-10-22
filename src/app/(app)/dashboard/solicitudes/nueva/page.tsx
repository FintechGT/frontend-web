"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Upload, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/app/services/cloudinary";

type Metodo = "domicilio" | "oficina";
type Condicion = "nuevo" | "seminuevo" | "usado" | "malo";

type TipoArticulo = { id_tipo: number; nombre: string };

// Posibles formas en las que puede venir el catálogo desde el backend
type TipoArticuloRow = {
  id_tipo?: number;
  IdTipo?: number;
  id?: number;
  nombre?: string;
  Nombre?: string;
};

type ArtForm = {
  id_tipo: number | "";
  descripcion: string;
  valor_estimado: string;
  condicion: Condicion | "";
  files: File[];
  previews: string[];
};

export default function NuevaSolicitudPage(): React.ReactElement {
  const router = useRouter();

  const [tipos, setTipos] = React.useState<TipoArticulo[]>([]);
  const [metodo, setMetodo] = React.useState<Metodo>("oficina");
  const [direccion, setDireccion] = React.useState("");
  const [articulos, setArticulos] = React.useState<ArtForm[]>([
    { id_tipo: "", descripcion: "", valor_estimado: "", condicion: "", files: [], previews: [] },
  ]);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingTipos, setLoadingTipos] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const objectUrlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingTipos(true);

        // Tipamos la respuesta para evitar `any`
        const { data } = await api.get<TipoArticuloRow[]>("/catalogos/tipos_articulo");
        const rows: TipoArticuloRow[] = Array.isArray(data) ? data : [];

        const items: TipoArticulo[] = rows.map((o) => ({
          id_tipo: Number(o.id_tipo ?? o.IdTipo ?? o.id ?? 0),
          nombre: String(o.nombre ?? o.Nombre ?? "Tipo"),
        }));

        if (!mounted) return;
        setTipos(items);

        // Si el primer artículo no tiene tipo seleccionado, asignamos el primero del catálogo
        setArticulos((prev) =>
          prev.map((a) => ({
            ...a,
            id_tipo: a.id_tipo === "" && items[0] ? items[0].id_tipo : a.id_tipo,
          })),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudieron cargar los tipos de artículo.");
      } finally {
        setLoadingTipos(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addArticulo = () =>
    setArticulos((p) => [
      ...p,
      {
        id_tipo: tipos[0]?.id_tipo ?? "",
        descripcion: "",
        valor_estimado: "",
        condicion: "",
        files: [],
        previews: [],
      },
    ]);

  const removeArticulo = (idx: number) =>
    setArticulos((p) => {
      const copy = [...p];
      for (const url of copy[idx].previews) URL.revokeObjectURL(url);
      objectUrlsRef.current = objectUrlsRef.current.filter((u) => !copy[idx].previews.includes(u));
      copy.splice(idx, 1);
      return copy.length ? copy : p;
    });

  const onFiles = (idx: number, fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const nonImages = files.filter((f) => !f.type.startsWith("image/"));
    if (nonImages.length) {
      setError("Solo se permiten imágenes (JPG, PNG, WebP).");
      return;
    }
    const MAX = 5 * 1024 * 1024;
    const big = files.filter((f) => f.size > MAX);
    if (big.length) {
      setError("Algunas imágenes superan 5MB.");
      return;
    }
    const previews = files.map((f) => {
      const url = URL.createObjectURL(f);
      objectUrlsRef.current.push(url);
      return url;
    });
    setArticulos((p) => {
      const c = [...p];
      c[idx] = { ...c[idx], files: [...c[idx].files, ...files], previews: [...c[idx].previews, ...previews] };
      return c;
    });
  };

  const removeFoto = (aIdx: number, fIdx: number) =>
    setArticulos((p) => {
      const c = [...p];
      const url = c[aIdx].previews[fIdx];
      if (url) {
        URL.revokeObjectURL(url);
        objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== url);
      }
      c[aIdx] = {
        ...c[aIdx],
        files: c[aIdx].files.filter((_, i) => i !== fIdx),
        previews: c[aIdx].previews.filter((_, i) => i !== fIdx),
      };
      return c;
    });

  const setField = <K extends keyof ArtForm>(idx: number, key: K, val: ArtForm[K]) =>
    setArticulos((p) => {
      const c = [...p];
      c[idx] = { ...c[idx], [key]: val };
      return c;
    });

  const totalFotos = React.useMemo(
    () => articulos.reduce((acc, a) => acc + a.files.length, 0),
    [articulos],
  );

  const totalEstimado = React.useMemo(
    () =>
      articulos.reduce(
        (acc, a) => acc + (Number.isFinite(Number(a.valor_estimado)) ? Number(a.valor_estimado) : 0),
        0,
      ),
    [articulos],
  );

  const validate = () => {
    if (metodo === "domicilio" && !direccion.trim()) return "La dirección es obligatoria para domicilio.";
    if (!articulos.length) return "Agrega al menos un artículo.";
    for (let i = 0; i < articulos.length; i++) {
      const a = articulos[i];
      if (a.id_tipo === "" || !Number.isFinite(Number(a.id_tipo))) return `Artículo #${i + 1}: selecciona el tipo.`;
      if (!a.descripcion.trim()) return `Artículo #${i + 1}: la descripción es requerida.`;
      const ve = Number(a.valor_estimado);
      if (!Number.isFinite(ve) || ve <= 0) return `Artículo #${i + 1}: el valor estimado debe ser mayor a 0.`;
      if (!a.condicion) return `Artículo #${i + 1}: selecciona la condición.`;
      if (a.files.length === 0) return `Artículo #${i + 1}: agrega al menos una foto.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      const FOLDER = "pignoraticios/solicitudes";
      const articulosConUrls: Array<{
        id_tipo: number;
        descripcion: string;
        valor_estimado: number;
        condicion: string;
        fotos: Array<{ url: string; orden: number }>;
      }> = [];

      for (const a of articulos) {
        const urls: string[] = [];
        for (const f of a.files) {
          const url = await uploadToCloudinary(f, FOLDER);
          urls.push(url);
        }
        articulosConUrls.push({
          id_tipo: Number(a.id_tipo),
          descripcion: a.descripcion.trim(),
          valor_estimado: Number(a.valor_estimado),
          condicion: a.condicion as string,
          fotos: urls.map((u, i) => ({ url: u, orden: i + 1 })),
        });
      }

      const payload = {
        metodo_entrega: metodo,
        ...(metodo === "domicilio" ? { direccion_entrega: direccion.trim() } : {}),
        articulos: articulosConUrls,
      };

      const { data } = await api.post("/solicitudes-completa", payload);
      router.push(`/dashboard/solicitudes/${(data as { id_solicitud?: string })?.id_solicitud ?? ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la solicitud.");
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    return () => {
      for (const u of objectUrlsRef.current) URL.revokeObjectURL(u);
      objectUrlsRef.current = [];
    };
  }, []);

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
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-400" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-medium">Datos de entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-neutral-300">Método de entrega</span>
              <select
                className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as Metodo)}
                disabled={submitting}
              >
                <option value="domicilio">Domicilio (recogemos el artículo)</option>
                <option value="oficina">Oficina (lo lleva el usuario)</option>
              </select>
            </label>

            {metodo === "domicilio" && (
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-neutral-300">
                  Dirección completa <span className="text-red-400">*</span>
                </span>
                <input
                  className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Calle, número, zona, ciudad…"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  disabled={submitting}
                  required
                />
              </label>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Artículos ({articulos.length})</h2>
            <button
              type="button"
              onClick={addArticulo}
              disabled={submitting || loadingTipos}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500 disabled:opacity-50"
            >
              <Plus className="size-4" />
              Agregar artículo
            </button>
          </div>

          <ul className="grid gap-4">
            {articulos.map((a, idx) => (
              <li key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-neutral-400">Artículo #{idx + 1}</div>
                  {articulos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArticulo(idx)}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                      Quitar
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">
                      Tipo (catálogo) <span className="text-red-400">*</span>
                    </span>
                    <select
                      className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
                      value={a.id_tipo === "" ? "" : Number(a.id_tipo)}
                      onChange={(e) => setField(idx, "id_tipo", e.target.value === "" ? "" : Number(e.target.value))}
                      disabled={submitting || loadingTipos}
                      required
                    >
                      <option value="" disabled>
                        {loadingTipos ? "Cargando..." : "Selecciona…"}
                      </option>
                      {tipos.map((t) => (
                        <option key={t.id_tipo} value={t.id_tipo}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">
                      Valor estimado (Q) <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
                      placeholder="1800.00"
                      value={a.valor_estimado}
                      onChange={(e) => setField(idx, "valor_estimado", e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </label>

                  <label className="grid gap-1 text-sm sm:col-span-2">
                    <span className="text-neutral-300">
                      Descripción detallada <span className="text-red-400">*</span>
                    </span>
                    <textarea
                      className="resize-none rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
                      placeholder="Ej: iPhone 12 128GB, negro, con caja y cargador"
                      rows={3}
                      value={a.descripcion}
                      onChange={(e) => setField(idx, "descripcion", e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">
                      Condición <span className="text-red-400">*</span>
                    </span>
                    <select
                      className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 outline-none focus:border-blue-500"
                      value={a.condicion}
                      onChange={(e) => setField(idx, "condicion", e.target.value as Condicion | "")}
                      disabled={submitting}
                      required
                    >
                      <option value="">Selecciona…</option>
                      <option value="nuevo">Nuevo</option>
                      <option value="seminuevo">Seminuevo</option>
                      <option value="usado">Usado</option>
                      <option value="malo">Malo</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">
                      Fotos <span className="text-red-400">*</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        id={`files-${idx}`}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => onFiles(idx, e.target.files)}
                        disabled={submitting}
                      />
                      <label
                        htmlFor={`files-${idx}`}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 ${
                          submitting ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      >
                        <Upload className="size-4" />
                        Seleccionar
                      </label>
                      <span className="text-xs text-neutral-400">
                        {a.files.length} archivo(s)
                        {a.files.length === 0 && <span className="ml-1 text-red-400">(mínimo 1)</span>}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">JPG/PNG/WebP · ≤ 5MB</div>
                  </label>

                  {a.previews.length > 0 && (
                    <div className="sm:col-span-2">
                      <div className="mb-2 text-xs text-neutral-400">Vista previa ({a.previews.length})</div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                        {a.previews.map((src, i) => (
                          <div key={src} className="group relative">
                            <div className="overflow-hidden rounded-xl border border-white/10">
                              <Image
                                src={src}
                                alt={`Foto ${i + 1}`}
                                width={240}
                                height={160}
                                className="h-24 w-full object-cover"
                                unoptimized
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFoto(idx, i)}
                              disabled={submitting}
                              className="absolute right-1 top-1 rounded-md bg-black/80 px-2 py-1 text-[10px] text-red-400 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                              title="Quitar foto"
                            >
                              Quitar
                            </button>
                            <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                              #{i + 1}
                            </div>
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

        <section className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="text-sm">
            <div className="mb-2 font-medium text-blue-400">Resumen de la solicitud</div>
            <ul className="space-y-1 text-neutral-300">
              <li>
                • Método: <span className="font-medium capitalize">{metodo}</span>
              </li>
              {metodo === "domicilio" && direccion && (
                <li>
                  • Dirección: <span className="font-medium">{direccion}</span>
                </li>
              )}
              <li>
                • Artículos: <span className="font-medium">{articulos.length}</span>
              </li>
              <li>
                • Fotos totales: <span className="font-medium">{totalFotos}</span>
              </li>
              <li>
                • Valor estimado total:{" "}
                <span className="font-medium text-emerald-400">Q {totalEstimado.toFixed(2)}</span>
              </li>
            </ul>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creando solicitud...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Crear solicitud
              </>
            )}
          </button>
          <Link
            href="/dashboard/solicitudes"
            className={`inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5 ${
              submitting ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
