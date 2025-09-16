"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/services/auth";

function getErrorMessage(err: unknown, fallback = "Error al iniciar sesión"): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err;
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("access_token", data.access_token);
      setMsg("¡Inicio de sesión exitoso! Redirigiendo…");
      router.push("/dashboard");
    } catch (err) {
      setMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>

        <label className="block">
          <span className="text-sm text-neutral-300">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 font-medium disabled:opacity-60">
          {loading ? "Ingresando…" : "Entrar"}
        </button>

        {msg && <p className="text-sm text-red-300">{msg}</p>}

        <p className="text-xs text-neutral-400">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Crear cuenta
          </a>
        </p>
      </form>
    </main>
  );
}
