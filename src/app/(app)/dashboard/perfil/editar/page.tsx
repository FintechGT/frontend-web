// src/app/(app)/dashboard/perfil/editar/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/app/AppLayoutClient";
import api from "@/lib/api";

type UpdateMeInput = {
  nombre?: string;
  telefono?: string;
  direccion?: string;
};

function getErrMsg(err: unknown): string {
  return err instanceof Error ? err.message : "Error desconocido";
}

export default function EditarPerfilPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();

  // campos controlados (correo solo lectura)
  const [nombre, setNombre] = React.useState<string>(user?.nombre ?? "");
  const [telefono, setTelefono] = React.useState<string>("");
  const [direccion, setDireccion] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // si cambia el user desde el contexto, sincronizamos el nombre inicial
  React.useEffect(() => {
    if (user?.nombre) setNombre(user.nombre);
  }, [user?.nombre]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Solo mandamos campos que el usuario quiso editar
      const payload: UpdateMeInput = {};
      const n = nombre.trim();
      const t = telefono.trim();
      const d = direccion.trim();

      if (n && n !== (user?.nombre ?? "")) payload.nombre = n;
      if (t) payload.telefono = t;
      if (d) payload.direccion = d;

      if (Object.keys(payload).length === 0) {
        toast.info("No hiciste cambios");
        setSubmitting(false);
        return;
      }

      await api.patch("/usuarios/me", payload);
      toast.success("Perfil actualizado");
      await refresh();
      router.push("/dashboard/perfil");
    } catch (err) {
      toast.error(getErrMsg(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Editar perfil</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Actualiza tu nombre, teléfono y dirección. El correo no se puede modificar.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
      >
        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm text-neutral-300">Nombre</span>
            <input
              className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </label>

          <label className="block">
            <span className="text-sm text-neutral-300">Correo (solo lectura)</span>
            <input
              className="mt-1 w-full cursor-not-allowed rounded-xl bg-neutral-900/60 border border-white/10 px-3 py-2 text-neutral-400"
              value={user?.correo ?? "—"}
              readOnly
              disabled
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-neutral-300">Teléfono</span>
              <input
                className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Opcional"
                inputMode="tel"
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
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
          >
            {submitting ? "Guardando…" : "Guardar cambios"}
          </button>

          <Link
            href="/dashboard/perfil"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
