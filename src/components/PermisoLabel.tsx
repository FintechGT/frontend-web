"use client";

import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { usePermiso } from "@/hooks/usePermiso";

type Props = {
  permiso: string;
  label?: string;
};

export function PermisoLabel({ permiso, label }: Props) {
  const tiene = usePermiso(permiso);
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
      tiene 
        ? "bg-emerald-500/15 text-emerald-400"
        : "bg-neutral-500/15 text-neutral-400"
    }`}>
      {tiene ? (
        <ShieldCheck className="size-3" />
      ) : (
        <Shield className="size-3" />
      )}
      <span>{label || permiso}</span>
    </div>
  );
}