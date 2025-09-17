"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { loginUser, loginWithGoogle, saveToken, type LoginInput } from "@/app/services/auth";

function getErrorMessage(err: unknown, fallback = "Error al iniciar sesión"): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err;
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: LoginInput = {
        email: email.trim().toLowerCase(),
        password,
      };
      const { access_token } = await loginUser(payload);
      saveToken(access_token);
      toast.success("Sesión iniciada");
      router.push("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSuccess(id_token: string) {
    try {
      setLoading(true);
      const { access_token } = await loginWithGoogle(id_token);
      saveToken(access_token);
      toast.success("Sesión iniciada con Google");
      router.push("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo iniciar con Google"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh grid place-items-center bg-neutral-950 text-neutral-100 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm mx-auto space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>

        <label className="block">
          <span className="text-sm text-neutral-300">Correo</span>
          <input
            type="email"
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="tucorreo@dominio.com"
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
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-neutral-400">o continúa con</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <GoogleSignInButton
          onSuccess={onGoogleSuccess}
          onError={(e) => toast.error(getErrorMessage(e, "No se pudo iniciar con Google"))}
        />

        <p className="text-xs text-neutral-400 text-center">
          ¿No tienes cuenta?{" "}
          <a className="text-blue-400 hover:underline" href="/register">
            Crear una cuenta
          </a>
        </p>
      </form>
    </main>
  );
}
