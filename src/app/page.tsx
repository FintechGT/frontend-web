"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ShieldCheck,
  Zap,
  Wallet,
  Bell,
  Headphones,
  Smartphone,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const bgGrid = useMemo(
    () =>
      "before:absolute before:inset-0 before:[background-image:radial-gradient(hsl(0_0%_100%/.06)_1px,transparent_1px)] before:[background-size:18px_18px] before:opacity-60",
    []
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className={`relative overflow-hidden ${bgGrid}`} aria-label="Hero">
        <div className="pointer-events-none absolute -inset-[40%] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.35),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.20),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10 lg:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
              Plataforma segura · 24/7
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
              Sistema de <span className="text-blue-400">Empeños</span> Online
            </h1>
            <p className="mt-4 text-neutral-300">
              Solicita préstamos dejando tus artículos en garantía, da
              seguimiento a tus solicitudes y gestiona pagos desde una sola
              plataforma: rápida, segura y transparente.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition px-5 py-3 text-sm font-medium shadow-lg shadow-blue-600/25"
              >
                Comenzar ahora
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 transition px-5 py-3 text-sm font-medium"
              >
                Ver características
              </a>
            </div>
            <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ["+99.9%", "Uptime"],
                ["< 2 min", "Aprobación pre-evaluación"],
                ["256-bit", "Cifrado"],
                ["24/7", "Soporte"],
              ].map(([stat, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5"
                >
                  <dt className="text-sm text-neutral-400">{label}</dt>
                  <dd className="text-2xl font-semibold">{stat}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Características</h2>
            <p className="mt-2 text-neutral-300">
              Hecho para ser simple, potente y confiable desde el día uno.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<ShieldCheck className="size-5" />}
              title="Seguridad bancaria"
              desc="Autenticación JWT, cifrado y auditoría de acciones."
            />
            <FeatureCard
              icon={<Zap className="size-5" />}
              title="Rápido y sencillo"
              desc="Flujos optimizados para solicitar, aprobar y pagar."
            />
            <FeatureCard
              icon={<Wallet className="size-5" />}
              title="Pagos integrados"
              desc="Comprobantes y estados de cuenta en tiempo real."
            />
            <FeatureCard
              icon={<Bell className="size-5" />}
              title="Notificaciones"
              desc="Alertas de vencimiento y recordatorios automáticos."
            />
            <FeatureCard
              icon={<Headphones className="size-5" />}
              title="Soporte humano"
              desc="Acompañamiento por chat, teléfono y correo."
            />
            <FeatureCard
              icon={<Smartphone className="size-5" />}
              title="Multiplataforma"
              desc="Web y móvil con la misma experiencia impecable."
            />
          </div>
        </div>
      </section>

      <section id="how" className="py-16 lg:py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">¿Cómo funciona?</h2>
            <p className="mt-2 text-neutral-300">
              Tres pasos claros para obtener tu préstamo con garantía.
            </p>
          </div>
          <ol className="grid sm:grid-cols-3 gap-6">
            {[
              ["Regístrate", "Crea tu cuenta y verifica tu identidad."],
              ["Solicita", "Registra el artículo y recibe una pre-evaluación."],
              ["Recibe y paga", "Firma tu contrato, recibe el dinero y gestiona pagos."],
            ].map(([title, desc], i) => (
              <li
                key={title}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <span className="absolute -top-3 left-6 inline-flex items-center justify-center size-8 rounded-full bg-blue-600 text-sm font-bold">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-neutral-300">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-emerald-500/20 p-8 text-center">
            <h3 className="text-2xl font-bold">¿Listo para empezar con EmpeñosGT?</h3>
            <p className="mt-2 text-neutral-200">
              Regístrate en minutos y lleva el control de tus préstamos.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/register"
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-medium"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="px-5 py-3 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 transition font-medium"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} EmpeñosGT. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-neutral-200">
              Términos
            </a>
            <a href="#" className="hover:text-neutral-200">
              Privacidad
            </a>
            <a href="#" className="hover:text-neutral-200">
              Soporte
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon?: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
      <div className="mb-3 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 group-hover:scale-105 transition">
        {icon ?? <span className="block size-5" />}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-neutral-300">{desc}</p>
    </div>
  );
}
