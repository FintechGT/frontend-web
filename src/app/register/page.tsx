"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  function parseError(data: any, fallback = "No se pudo crear la cuenta") {
    const detail = data?.detail ?? data?.message ?? data;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      
      const msgs = detail.map((d) => d?.msg || d?.message || JSON.stringify(d)).filter(Boolean);
      return msgs.join("\n") || fallback;
    }
    if (detail && typeof detail === "object") {
      return detail.message || detail.error || JSON.stringify(detail);
    }
    return fallback;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL!;
      const res = await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: nombre, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(parseError(data));
      }

      toast.success("Cuenta creada. Ahora inicia sesión.");
      setNombre("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh grid place-items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm mx-auto space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center">Crear cuenta</h1>

        <label className="block">
          <span className="text-sm text-neutral-300">Nombre</span>
          <input
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300">Correo</span>
          <input
            type="email"
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="tucorreo@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300">Contraseña</span>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 pr-10 outline-none focus:border-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-200"
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Creando…" : "Registrarme"}
        </button>

        <p className="text-xs text-neutral-400 text-center">
          ¿Ya tienes cuenta?{" "}
          <a className="text-blue-400 hover:underline" href="/login">
            Inicia sesión
          </a>
        </p>
      </form>
    </main>
  );
}
