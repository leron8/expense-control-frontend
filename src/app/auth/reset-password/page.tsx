"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, updatePassword } from "../../../lib/api";
import { getPasswordValidationError, MIN_PASSWORD_LENGTH, readAuthFragment } from "../../../lib/auth";
import { getAuthToken, setAuthToken } from "../../../lib/session";

function getResetErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "invalid_password") return error.message;
    if (error.code === "invalid_token") return "El enlace de recuperación ya no es válido. Solicita uno nuevo.";
  }

  return error instanceof Error ? error.message : "No pudimos actualizar tu contraseña.";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { accessToken, errorDescription } = readAuthFragment(window.location.hash);

    if (accessToken) {
      setAuthToken(accessToken);
      window.history.replaceState(null, "", window.location.pathname);
      setReady(true);
      return;
    }

    if (getAuthToken()) {
      setReady(true);
      return;
    }

    setError(errorDescription ?? "El enlace de recuperación es inválido o expiró.");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const passwordError = getPasswordValidationError(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      await updatePassword(password);
      router.replace("/onboarding");
    } catch (currentError) {
      setError(getResetErrorMessage(currentError));
    } finally {
      setLoading(false);
    }
  }

  if (!ready && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-slate-400">Validando tu enlace de recuperación...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card-surface w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-white">Restablecer contraseña</h1>
          <p className="text-sm text-slate-400">
            Elige una nueva contraseña para volver a entrar a tu espacio.
          </p>
        </div>

        {ready ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nueva contraseña"
              autoComplete="new-password"
              required
            />
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

            {error ? <p className="text-center text-sm text-rose-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="primary"
            >
              {loading ? "Actualizando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-rose-400">{error}</p>
            <Link href="/auth/login" className="text-sm text-cyan-400 transition hover:underline">
              Volver al acceso
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
