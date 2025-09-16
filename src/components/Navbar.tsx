// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Oculta el navbar en páginas de auth y en el área privada (dashboard)
  const hide =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/dashboard");

  if (hide) return null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-white/10 bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 dark:bg-neutral-950/70">
      <nav className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="text-neutral-200">Empeños</span>
          <span className="text-blue-400">GT</span>
        </Link>

        <ul className="hidden gap-6 text-sm text-neutral-300 md:flex">
          <li>
            <a href="#features" className="hover:text-white">
              Características
            </a>
          </li>
          <li>
            <a href="#how" className="hover:text-white">
              ¿Cómo funciona?
            </a>
          </li>
          <li>
            <a href="#faq" className="hover:text-white">
              Preguntas
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl border border-white/10 px-3 py-1.5 text-sm text-neutral-200 hover:bg-white/5 md:inline-block"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Crear cuenta
          </Link>
        </div>
      </nav>
    </header>
  );
}
