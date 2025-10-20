// src/app/(app)/dashboard/seguridad/page.tsx
"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../../components/ui/tabs";
import ModulosTab from "./_components/ModulosTab";
import PermisosTab from "./_components/PermisosTab";
import RolesTab from "./_components/RolesTab";
import { Shield } from "lucide-react";

/* ============================================================
   Página principal de Seguridad
   ============================================================ */
export default function SeguridadPage():React.ReactElement {
  const [tab, setTab] = React.useState("roles");

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="flex items-center gap-3">
        <Shield className="size-6 text-blue-400" />
        <h1 className="text-2xl font-semibold tracking-tight">Seguridad y Accesos</h1>
      </header>

      {/* Tabs principales */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-black/30 p-1">
          <TabsTrigger
            value="roles"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "roles" ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            Roles
          </TabsTrigger>
          <TabsTrigger
            value="permisos"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "permisos" ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            Permisos
          </TabsTrigger>
          <TabsTrigger
            value="modulos"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "modulos" ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            Módulos
          </TabsTrigger>
        </TabsList>

        {/* Contenido de cada tab */}
        <div className="mt-6">
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
          <TabsContent value="permisos">
            <PermisosTab />
          </TabsContent>
          <TabsContent value="modulos">
            <ModulosTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
