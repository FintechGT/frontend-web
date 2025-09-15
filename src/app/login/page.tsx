"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "@/app/services/auth";

/** Convierte cualquier payload de error en texto legible */
function parseError(payload: any, fallback = "Error al iniciar sesión") {
  // algunos backends usan detail, otros message
  const detail = payload?.detail ?? payload?.message ?? payload;

  // string directo
  if (typeof detail === "string") return detail;

  // lista de errores (p.ej. FastAPI/Pydantic: [{loc, msg, type}, ...])
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => d?.msg || d?.message || JSON.stringify(d))
      .filter(Boolean)
      .join("\n");
  }

  // objeto suelto
  if (detail && typeof detail === "object") {
    return (
      detail.message ||
      detail.error ||
      detail.detail || // a veces viene anidado otra vez
      JSON.stringify(detail)
    );
  }

  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { access_token } = await loginUser({ email, password });
      localStorage.setItem("access_token", access_token);

      toast.success("¡Bienvenido! Redirigiendo…");
      setPassword("");
      router.push("/dashboard"); // ajusta si aún no tienes ruta
    } catch (err: any) {
      // si axios trae response, parseamos el body
      const msg = err?.response?.data
        ? parseError(err.response.data)
        : err?.message || "Error al iniciar sesión";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh grid place-items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>

        <label className="block">
          <span className="text-sm text-neutral-300">Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="tucorreo@dominio.com"
            className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-300">Contraseña</span>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 pr-10 outline-none focus:border-blue-500"
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
          {loading ? "Ingresando…" : "Entrar"}
        </button>

        <p className="text-xs text-neutral-400 text-center">
          ¿No tienes cuenta?{" "}
          <a className="text-blue-400 hover:underline" href="/register">
            Crear cuenta
          </a>
        </p>
      </form>
    </main>
  );
}
