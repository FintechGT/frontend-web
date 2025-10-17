"use client";

import * as React from "react";
import AdminSolicitudesPage from "./AdminSolicitudes";
import MisSolicitudesPage from "./MisSolicitudes";
import { useEsAdmin } from "../../../../hooks/useEsAdmin"
import { RotateCw, AlertCircle } from "lucide-react";

export default function PageSolicitudes() {
  const { checking, esAdmin, error } = useEsAdmin();

  if (checking) {
    return (
      <div className="text-neutral-400 flex items-center justify-center py-16">
        <RotateCw className="mr-2 animate-spin" />
        Verificando permisos…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 flex items-center justify-center py-16">
        <AlertCircle className="mr-2" />
        {error}
      </div>
    );
  }

  return esAdmin ? <AdminSolicitudesPage /> : <MisSolicitudesPage />;
}
