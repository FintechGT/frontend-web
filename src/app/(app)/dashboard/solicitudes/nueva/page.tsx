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
import { ArrowLeft, Plus, Trash2, Upload, AlertCircle, Loader2 } from "lucide-react";
import { usePermiso } from "@/hooks/usePermiso";

type Metodo = "domicilio" | "oficina";
type Condicion = "nuevo" | "seminuevo" | "usado" | "malo";

type ArtForm = {
  id_tipo: number | "";
  descripcion: string;
  valor_estimado: string;
  condicion: Condicion | "";
  files: File[];
  previews: string[];
};

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const puedeCrear = usePermiso("solicitudes.create");

  const [metodo, setMetodo] = React.useState<Metodo>("domicilio");
  const [direccion, setDireccion] = React.useState<string>("");

  const [articulos, setArticulos] = React.useState<ArtForm[]>([
    {
      id_tipo: 1,
      descripcion: "",
      valor_estimado: "",
      condicion: "",
      files: [],
      previews: [],
    },
  ]);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Redirect si no tiene permiso
  React.useEffect(() => {
    if (!puedeCrear) {
      router.push("/dashboard/solicitudes");
    }
  }, [puedeCrear, router]);

  const addArticulo = () =>
    setArticulos((prev) => [
      ...prev,
      {
        id_tipo: 1,
        descripcion: "",
        valor_estimado: "",
        condicion: "",
        files: [],
        previews: [],
      },
    ]);

  const removeArticulo = (idx: number) =>
    setArticulos((prev) => prev.filter((_, i) => i !== idx));

  const onFiles = (idx: number, fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);

    // Validar tipo (solo imágenes)
    const nonImages = files.filter((f) => !f.type.startsWith("image/"));
    if (nonImages.length > 0) {
      setError("Solo se permiten imágenes (JPG, PNG, WebP).");
      return;
    }

    // Validar tamaño máximo (5MB por imagen)
    const MAX_SIZE = 5 * 1024 * 1024;
    const invalidFiles = files.filter((f) => f.size > MAX_SIZE);
    if (invalidFiles.length > 0) {
      setError("Algunas imágenes superan el tamaño máximo de 5MB.");
      return;
    }

    const previews = files.map((f) => URL.createObjectURL(f));
    setArticulos((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        files: [...copy[idx].files, ...files],
        previews: [...copy[idx].previews, ...previews],
      };
      return copy;
    });
  };

  const removeFoto = (aIdx: number, fIdx: number) => {
    setArticulos((prev) => {
      const copy = [...prev];
      const art = copy[aIdx];

      // Liberar URL del preview
      URL.revokeObjectURL(art.previews[fIdx]);

      const newFiles = art.files.filter((_, i) => i !== fIdx);
      const newPrev = art.previews.filter((_, i) => i !== fIdx);
      copy[aIdx] = { ...art, files: newFiles, previews: newPrev };
      return copy;
    });
  };

  const updateArticulo = (idx: number, field: keyof ArtForm, value: any) => {
    setArticulos((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (metodo === "domicilio" && !direccion.trim()) {
      setError("La dirección es obligatoria para método domicilio.");
      return;
    }

    if (articulos.length === 0) {
      setError("Agrega al menos un artículo.");
      return;
    }

    for (const [i, a] of articulos.entries()) {
      if (!a.descripcion.trim()) {
        setError(`Artículo #${i + 1}: La descripción es requerida.`);
        return;
      }
      const ve = Number(a.valor_estimado);
      if (!Number.isFinite(ve) || ve <= 0) {
        setError(`Artículo #${i + 1}: El valor estimado debe ser mayor a 0.`);
        return;
      }
      if (!a.condicion) {
        setError(`Artículo #${i + 1}: Selecciona una condición.`);
        return;
      }
      if (a.files.length === 0) {
        setError(`Artículo #${i + 1}: Debe incluir al menos una foto.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1) Subir fotos a Cloudinary
      const FOLDER = "pignoraticios/solicitudes";
      const articulosConUrls = [];

      for (const [i, a] of articulos.entries()) {
        const urls: string[] = [];

        for (const [j, file] of a.files.entries()) {
          try {
            const url = await uploadToCloudinary(file, FOLDER);
            urls.push(url);
          } catch (err) {
            throw new Error(
              `Error subiendo foto ${j + 1} del artículo ${i + 1}: ${
                err instanceof Error ? err.message : "Error desconocido"
              }`
            );
          }
        }

        articulosConUrls.push({
          id_tipo: Number(a.id_tipo || 1),
          descripcion: a.descripcion.trim(),
          valor_estimado: Number(a.valor_estimado),
          condicion: a.condicion,
          fotos: urls.map((u, idx) => ({ url: u, orden: idx + 1 })),
        });
      }

      // 2) Armar payload
      const payload: NuevaSolicitudPayload = {
        metodo_entrega: metodo,
        ...(metodo === "domicilio" ? { direccion_entrega: direccion.trim() } : {}),
        articulos: articulosConUrls,
      };

      // 3) Enviar al backend
      const creada = await crearSolicitudCompleta(payload);

      // 4) Redirigir al detalle
      router.push(`/dashboard/solicitudes/${creada.id_solicitud}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la solicitud.");
      setSubmitting(false);
    }
  }

  // Limpiar previews al desmontar
  React.useEffect(() => {
    return () => {
      articulos.forEach((a) => {
        a.previews.forEach((url) => URL.revokeObjectURL(url));
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si no tiene permiso, mostrar mensaje
  if (!puedeCrear) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-400" />
            <div>
              <div className="font-medium text-red-400">Acceso denegado</div>
              <div className="mt-1 text-sm text-red-300">
                No tienes permiso para crear solicitudes. Contacta al administrador.
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/solicitudes"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
            >
              <ArrowLeft className="size-4" />
              Volver a solicitudes
            </Link>
          </div>
        </div>
      </div>
    );
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
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-400" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de la solicitud */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="font-medium">Datos de entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-neutral-300">Método de entrega</span>
              <select
                className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as Metodo)}
                disabled={submitting}
              >
                <option value="domicilio">Domicilio (recogemos el artículo)</option>
                <option value="oficina">Oficina (lo llevas tú)</option>
              </select>
            </label>

            {metodo === "domicilio" && (
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-neutral-300">
                  Dirección completa <span className="text-red-400">*</span>
                </span>
                <input
                  className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
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

        {/* Artículos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Artículos ({articulos.length})
            </h2>
            <button
              type="button"
              onClick={addArticulo}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500 disabled:opacity-50"
            >
              <Plus className="size-4" />
              Agregar artículo
            </button>
          </div>

          <ul className="grid gap-4">
            {articulos.map((a, idx) => (
              <li
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-neutral-400">
                    Artículo #{idx + 1}
                  </div>
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
                      Tipo (ID catálogo) <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="number"
                      min={1}
                      className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                      value={a.id_tipo === "" ? "" : Number(a.id_tipo)}
                      onChange={(e) =>
                        updateArticulo(idx, "id_tipo", e.target.value === "" ? "" : Number(e.target.value))
                      }
                      disabled={submitting}
                      required
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">
                      Valor estimado (Q) <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                      placeholder="1800.00"
                      value={a.valor_estimado}
                      onChange={(e) => updateArticulo(idx, "valor_estimado", e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </label>

                  <label className="grid gap-1 text-sm sm:col-span-2">
                    <span className="text-neutral-300">
                      Descripción detallada <span className="text-red-400">*</span>
                    </span>
                    <textarea
                      className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500 resize-none"
                      placeholder="Ej: iPhone 12 de 128GB, color negro, con caja original y cargador"
                      rows={3}
                      value={a.descripcion}
                      onChange={(e) => updateArticulo(idx, "descripcion", e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="text-neutral-300">
                      Condición <span className="text-red-400">*</span>
                    </span>
                    <select
                      className="rounded-xl bg-neutral-900 px-3 py-2 border border-white/10 outline-none focus:border-blue-500"
                      value={a.condicion}
                      onChange={(e) =>
                        updateArticulo(idx, "condicion", e.target.value as Condicion)
                      }
                      disabled={submitting}
                      required
                    >
                      <option value="">Selecciona…</option>
                      <option value="nuevo">Nuevo (sin uso)</option>
                      <option value="seminuevo">Seminuevo (poco uso)</option>
                      <option value="usado">Usado (funcional)</option>
                      <option value="malo">Malo (requiere reparación)</option>
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
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Upload className="size-4" />
                        Seleccionar
                      </label>
                      <span className="text-xs text-neutral-400">
                        {a.files.length} archivo(s)
                        {a.files.length === 0 && (
                          <span className="text-red-400 ml-1">(mínimo 1)</span>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      Formatos: JPG, PNG, WebP. Máx 5MB por imagen.
                    </div>
                  </label>

                  {/* Previews (full width) */}
                  {a.previews.length > 0 && (
                    <div className="sm:col-span-2">
                      <div className="text-xs text-neutral-400 mb-2">
                        Vista previa ({a.previews.length})
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                        {a.previews.map((src, i) => (
                          <div key={src} className="relative group">
                            <img
                              src={src}
                              alt={`Foto ${i + 1}`}
                              className="h-24 w-full rounded-xl object-cover border border-white/10"
                            />
                            <button
                              type="button"
                              onClick={() => removeFoto(idx, i)}
                              disabled={submitting}
                              className="absolute right-1 top-1 rounded-md bg-black/80 px-2 py-1 text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
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

        {/* Resumen antes de enviar */}
        <section className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="text-sm">
            <div className="font-medium text-blue-400 mb-2">
              Resumen de tu solicitud
            </div>
            <ul className="space-y-1 text-neutral-300">
              <li>
                • Método: <span className="font-medium">{metodo}</span>
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
                • Fotos totales:{" "}
                <span className="font-medium">
                  {articulos.reduce((sum, a) => sum + a.files.length, 0)}
                </span>
              </li>
              <li>
                • Valor estimado total:{" "}
                <span className="font-medium text-emerald-400">
                  Q
                  {articulos
                    .reduce((sum, a) => sum + (Number(a.valor_estimado) || 0), 0)
                    .toFixed(2)}
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* Info adicional */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-neutral-400">
          <div className="font-medium text-neutral-300 mb-2">ℹ️ Información importante</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Las fotos se subirán a la nube de forma segura</li>
            <li>El proceso de carga puede tardar unos segundos</li>
            <li>Una vez creada, tu solicitud será revisada por un valuador</li>
            <li>Recibirás notificaciones sobre el estado de tu solicitud</li>
            {metodo === "domicilio" && (
              <li className="text-yellow-400">
                Para domicilio: asegúrate de que la dirección sea correcta, nos contactaremos contigo
              </li>
            )}
          </ul>
        </div>
      </form>
    </div>
  );
}
