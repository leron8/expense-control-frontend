"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  loginWithPassword,
  registerWithPassword,
  requestPasswordReset,
} from "../../../lib/api";
import { getPasswordValidationError, MIN_PASSWORD_LENGTH } from "../../../lib/auth";
import { getActiveOrganizationId, getAuthToken, setAuthToken } from "../../../lib/session";

type AuthMode = "login" | "register" | "recover";

function getErrorMessage(error: unknown, mode: AuthMode): string {
  if (error instanceof ApiError) {
    if (error.code === "invalid_email") return "Ingresa un correo válido.";
    if (error.code === "invalid_password") return error.message;
    if (error.code === "invalid_credentials") return "Correo o contraseña incorrectos.";
    if (error.code === "email_not_confirmed") return "Confirma tu correo antes de iniciar sesión.";
    if (error.code === "user_already_exists") return "Ya existe una cuenta con ese correo.";
  }

  if (mode === "recover") {
    return error instanceof Error ? error.message : "No pudimos enviar las instrucciones.";
  }

  if (mode === "register") {
    return error instanceof Error ? error.message : "No pudimos crear tu cuenta.";
  }

  return error instanceof Error ? error.message : "No pudimos iniciar sesión.";
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      return;
    }

    router.replace(getActiveOrganizationId() ? "/" : "/onboarding");
  }, [router]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setNotice(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();

    try {
      if (mode === "login") {
        const response = await loginWithPassword(trimmedEmail, password);
        if (!response.accessToken) {
          throw new Error("La autenticación se completó sin una sesión activa.");
        }

        setAuthToken(response.accessToken);
        router.replace("/onboarding");
        return;
      }

      if (mode === "register") {
        const passwordError = getPasswordValidationError(password);
        if (passwordError) {
          setError(passwordError);
          return;
        }

        if (password !== confirmPassword) {
          setError("Las contraseñas no coinciden.");
          return;
        }

        const response = await registerWithPassword(trimmedEmail, password);

        if (response.accessToken) {
          setAuthToken(response.accessToken);
          router.replace("/onboarding");
          return;
        }

        setNotice("Revisa tu correo para confirmar tu cuenta y terminar el acceso.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      const response = await requestPasswordReset(trimmedEmail);
      setNotice(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (currentError) {
      setError(getErrorMessage(currentError, mode));
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = mode === "login"
    ? (loading ? "Entrando..." : "Iniciar sesión")
    : mode === "register"
      ? (loading ? "Creando cuenta..." : "Crear cuenta")
      : (loading ? "Enviando..." : "Enviar instrucciones");

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card-surface w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-white">Caja Fácil</h1>
          <p className="text-sm text-slate-400">Control financiero personal y para pequeños negocios</p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 p-1 text-sm">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-xl px-3 py-2 transition ${mode === "login" ? "bg-cyan-500/10 text-cyan-300" : "text-slate-400 hover:text-slate-200"}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`rounded-xl px-3 py-2 transition ${mode === "register" ? "bg-cyan-500/10 text-cyan-300" : "text-slate-400 hover:text-slate-200"}`}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => switchMode("recover")}
            className={`rounded-xl px-3 py-2 transition ${mode === "recover" ? "bg-cyan-500/10 text-cyan-300" : "text-slate-400 hover:text-slate-200"}`}
          >
            Recuperar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            required
          />

          {mode !== "recover" ? (
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          ) : null}

          {mode === "register" ? (
            <>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirmar contraseña"
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-slate-500">
                Usa al menos {MIN_PASSWORD_LENGTH} caracteres, con una letra y un número.
              </p>
            </>
          ) : null}

          {mode === "recover" ? (
            <p className="text-xs text-slate-500">
              Si antes entrabas con enlace mágico, este correo te permitirá definir tu contraseña.
            </p>
          ) : null}

          {error ? <p className="text-center text-sm text-rose-400">{error}</p> : null}
          {notice ? <p className="text-center text-sm text-emerald-300">{notice}</p> : null}

          <button
            type="submit"
            disabled={loading || !email || (mode !== "recover" && !password) || (mode === "register" && !confirmPassword)}
            className="primary"
          >
            {submitLabel}
          </button>
        </form>

        {mode === "login" ? (
          <div className="space-y-3 text-center">
            <button
              type="button"
              onClick={() => switchMode("recover")}
              className="text-sm text-cyan-400 transition hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <p className="text-xs text-slate-500">
              Si tu cuenta usaba enlaces mágicos, puedes crear tu contraseña desde recuperación.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
