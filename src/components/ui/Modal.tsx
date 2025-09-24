"use client";

import * as React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  // Cerrar con ESC y bloquear scroll
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const node = (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Bottom-sheet en móvil / centrado en md+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-2xl bg-neutral-950 p-4 shadow-2xl
                   md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          {title ? <h3 className="text-sm font-medium">{title}</h3> : <span />}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
