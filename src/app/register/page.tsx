"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { registerUser, type RegisterInput, loginWithGoogle } from "@/app/services/auth";

function parseError(data: unknown, fallback = "No se pudo crear la cuenta"): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data instanceof Error) return data.message || fallback;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    return (obj.detail as string) || (obj.message as string) || fallback;
  }
  return fallback;
}

const ALLOWED_DOMAIN = "gmail.com"; // solo correos de Google

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const isAllowedEmail = (e: string) => e.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAllowedEmail(email)) {
      toast.error(`Solo se permiten correos @${ALLOWED_DOMAIN}`);
      return;
    }
    setLoading(true);
    try {
      const payload: RegisterInput = { nombre: nombre.trim(), email: email.trim().toLowerCase(), password };
      const res = await registerUser(payload);
      if (!res || (res as any)?.error) throw new Error(parseError(res));
      toast.success("Cuenta creada. Ahora inicia sesión.");
      setNombre("");
      setEmail("");
      setPassword("");
      router.push("/login");
    } catch (err) {
      toast.error(parseError(err, "Error al registrar"));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSuccess(id_token: string) {
    try {
      setLoading(true);
      const data = await loginWithGoogle(id_token); // crea o loguea en el backend
      localStorage.setItem("access_token", data.access_token);
      router.push("/dashboard");
    } catch (err) {
      toast.error(parseError(err, "No se pudo registrar con Google"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh grid place-items-center bg-neutral-950 text-neutral-100 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm mx-auto space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-center">Crear cuenta</h1>

        <p className="text-xs text-neutral-400 text-center">
          Solo se permiten cuentas <span className="text-neutral-200 font-medium">@{ALLOWED_DOMAIN}</span>
        </p>

        <label className="block">
          <span className="text-sm text-neutral-300">Nombre</span>
          <input
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300">Correo</span>
          <input
            type="email"
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
            placeholder={`tucorreo@${ALLOWED_DOMAIN}`}
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              minLength={6}
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

        {/* separador */}
        <div className="flex items-center gap-3 my-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-neutral-400">o continúa con</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Registro con Google (crea/entra de una vez) */}
        <GoogleSignInButton
          onSuccess={onGoogleSuccess}
          onError={() => toast.error("No se pudo registrar con Google")}
        />

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
