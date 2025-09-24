"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

type Perfil = {
  nombre: string | null;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
};

type UpdateMeInput = Partial<{
  nombre: string | null;
  telefono: string | null;
  direccion: string | null;
}>;

export default function EditarPerfilPage() {
  const router = useRouter();

  // estado inicial desde la API
  const [original, setOriginal] = React.useState<Perfil | null>(null);
  const [loading, setLoading] = React.useState(true);

  // campos editables
  const [nombre, setNombre] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [direccion, setDireccion] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Perfil>("/usuarios/me");
        if (!alive) return;
        setOriginal(data);
        setNombre(data.nombre ?? "");
        setTelefono(data.telefono ?? "");
        setDireccion(data.direccion ?? "");
      } catch {
        toast.error("No se pudo cargar tu perfil");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!original) return;

    // construir payload solo con cambios (PATCH parcial)
    const payload: UpdateMeInput = {};
    const nTrim = nombre.trim();
    if (nTrim !== (original.nombre ?? "")) payload.nombre = nTrim || null;

    if (telefono !== (original.telefono ?? "")) {
      payload.telefono = telefono.trim() ? telefono.trim() : null;
    }
    if (direccion !== (original.direccion ?? "")) {
      payload.direccion = direccion.trim() ? direccion.trim() : null;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No hay cambios para guardar");
      return;
    }

    try {
      setSaving(true);
      await api.patch("/usuarios/me", payload);
      toast.success("Perfil actualizado");
      router.push("/dashboard/perfil");
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="animate-pulse text-sm text-neutral-400">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Editar perfil</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Actualiza tu nombre, teléfono y dirección. El correo no se puede
          modificar.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
      >
        <label className="block">
          <span className="text-sm text-neutral-300">Nombre</span>
          <input
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            // <— ya NO es required
            placeholder="Opcional"
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300">Correo (solo lectura)</span>
          <input
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 opacity-70"
            value={original?.correo ?? ""}
            readOnly
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300">Teléfono</span>
          <input
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Opcional"
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300">Dirección</span>
          <input
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Opcional"
          />
        </label>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <a
            href="/dashboard/perfil"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 text-center"
          >
            Cancelar
          </a>
          <button
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
