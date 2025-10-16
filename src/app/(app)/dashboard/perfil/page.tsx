// src/app/(app)/dashboard/perfil/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import api from "@/lib/api";
import { PermisoLabel } from "@/components/PermisoLabel";
import { useAuth } from "@/app/AppLayoutClient";
import { Mail, Phone, MapPin, Calendar, Shield, CheckCircle, XCircle, Edit } from "lucide-react";

type Perfil = {
  id_usuario: number;
  nombre: string | null;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
  verificado?: boolean;
  estado_activo?: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function PerfilPage() {
  const { permisos } = useAuth();
  const [me, setMe] = React.useState<Perfil | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Perfil>("/usuarios/me");
        if (alive) setMe(data);
      } catch {
        if (alive) setMe(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <div className="text-sm text-neutral-400">Cargando perfil…</div>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="flex items-center gap-3">
          <XCircle className="size-5 text-red-400" />
          <div>
            <div className="font-medium text-red-400">Error al cargar</div>
            <div className="mt-1 text-sm text-red-300">
              No se pudo cargar tu perfil. Intenta refrescar la página.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tu perfil</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Información de tu cuenta y permisos activos
          </p>
        </div>
        <Link
          href="/dashboard/perfil/editar"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          <Edit className="size-4" />
          Editar
        </Link>
      </div>

      {/* Tarjeta principal de información */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start gap-4">
          {/* Avatar con iniciales */}
          <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-blue-600 text-2xl font-bold">
            {me.nombre
              ? me.nombre
                  .trim()
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : me.correo[0]?.toUpperCase() ?? "U"}
          </div>

          {/* Info principal */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{me.nombre || "Sin nombre"}</h2>
              {me.verificado ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
                  <CheckCircle className="size-3" />
                  Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-400">
                  <XCircle className="size-3" />
                  No verificado
                </span>
              )}
              {me.estado_activo !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    me.estado_activo
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {me.estado_activo ? "Activo" : "Inactivo"}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <Mail className="size-4 text-neutral-400" />
                <span>{me.correo}</span>
              </div>

              {me.telefono && (
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <Phone className="size-4 text-neutral-400" />
                  <span>{me.telefono}</span>
                </div>
              )}

              {me.direccion && (
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <MapPin className="size-4 text-neutral-400" />
                  <span>{me.direccion}</span>
                </div>
              )}

              {me.created_at && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Calendar className="size-4" />
                  <span>
                    Miembro desde{" "}
                    {new Date(me.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Permisos activos */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="size-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Permisos activos</h2>
          <span className="ml-auto rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-400">
            {permisos.length} permisos
          </span>
        </div>

        {permisos.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center text-sm text-neutral-400">
            No tienes permisos asignados. Contacta al administrador.
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-400 mb-3">
              Estos son los permisos que tienes activos en el sistema. Si necesitas
              acceso adicional, contacta al administrador.
            </p>

            <div className="flex flex-wrap gap-2">
              {/* Permisos principales destacados */}
              {[
                { permiso: "solicitudes.create", label: "Crear solicitudes" },
                { permiso: "solicitudes.view", label: "Ver solicitudes" },
                { permiso: "solicitudes.update", label: "Editar solicitudes" },
                { permiso: "solicitudes.delete", label: "Eliminar solicitudes" },
                { permiso: "pagos.view", label: "Ver pagos" },
                { permiso: "pagos.create", label: "Crear pagos" },
                { permiso: "pagos.validar", label: "Validar pagos" },
                { permiso: "pagos.reversar", label: "Reversar pagos" },
                { permiso: "usuarios.view", label: "Ver usuarios" },
                { permiso: "usuarios.create", label: "Crear usuarios" },
                { permiso: "usuarios.update", label: "Editar usuarios" },
                { permiso: "usuarios.cambiar_rol", label: "Cambiar roles" },
                { permiso: "valuacion.aprobar", label: "Aprobar valuaciones" },
                { permiso: "valuacion.rechazar", label: "Rechazar valuaciones" },
                { permiso: "recepciones.crear", label: "Registrar recepciones" },
                { permiso: "prestamos.recalcular", label: "Recalcular préstamos" },
                { permiso: "prestamos.evaluar_estado", label: "Evaluar estado" },
                { permiso: "prestamos.cerrar", label: "Cerrar préstamos" },
                { permiso: "seguridad.view", label: "Ver configuración" },
                { permiso: "seguridad.roles.crud", label: "Gestionar roles" },
                { permiso: "seguridad.permisos.crud", label: "Gestionar permisos" },
                { permiso: "seguridad.asignar_permisos", label: "Asignar permisos" },
              ].map((item) => (
                <PermisoLabel
                  key={item.permiso}
                  permiso={item.permiso}
                  label={item.label}
                />
              ))}

              {/* Mostrar otros permisos que tenga pero no estén en la lista */}
              {permisos
                .filter(
                  (p) =>
                    ![
                      "solicitudes.create",
                      "solicitudes.view",
                      "solicitudes.update",
                      "solicitudes.delete",
                      "pagos.view",
                      "pagos.create",
                      "pagos.validar",
                      "pagos.reversar",
                      "usuarios.view",
                      "usuarios.create",
                      "usuarios.update",
                      "usuarios.cambiar_rol",
                      "valuacion.aprobar",
                      "valuacion.rechazar",
                      "recepciones.crear",
                      "prestamos.recalcular",
                      "prestamos.evaluar_estado",
                      "prestamos.cerrar",
                      "seguridad.view",
                      "seguridad.roles.crud",
                      "seguridad.permisos.crud",
                      "seguridad.asignar_permisos",
                    ].includes(p)
                )
                .map((permiso) => (
                  <PermisoLabel key={permiso} permiso={permiso} />
                ))}
            </div>
          </>
        )}
      </div>

      {/* Información adicional */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="text-sm">
          <div className="font-medium text-blue-400 mb-2">ℹ️ Información importante</div>
          <ul className="space-y-1 text-neutral-300">
            <li>
              • Los permisos son gestionados por tu rol asignado en el sistema
            </li>
            <li>
              • Si necesitas permisos adicionales, contacta al administrador
            </li>
            <li>
              • Puedes actualizar tu información de contacto en cualquier momento
            </li>
            <li>
              • Para cambios en roles o permisos, se requiere aprobación administrativa
            </li>
          </ul>
        </div>
      </div>

      {/* Detalles técnicos (solo para debugging) */}
      {process.env.NODE_ENV === "development" && (
        <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <summary className="cursor-pointer text-sm font-medium text-neutral-400">
            Información técnica (debug)
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-black/50 p-3 text-xs text-neutral-300">
            {JSON.stringify(
              {
                perfil: me,
                permisos: permisos,
                total_permisos: permisos.length,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}