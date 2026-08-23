"use client";

import { useState, type FormEvent } from "react";
import { sendMagicLink } from "../../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el enlace");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Revisa tu correo</h1>
          <p className="text-slate-400">
            Te enviamos un enlace mágico a <strong className="text-cyan-300">{email}</strong>.
            Haz clic en el enlace para iniciar sesión.
          </p>
          <button onClick={() => { setSent(false); setEmail(""); }} className="text-sm text-cyan-400 hover:underline">
            Usar otro correo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Caja Fácil</h1>
          <p className="mt-2 text-sm text-slate-400">Control financiero personal y para pequeños negocios</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            className="text-center"
          />

          {error && <p className="text-sm text-rose-400 text-center">{error}</p>}

          <button type="submit" disabled={loading || !email} className="primary">
            {loading ? "Enviando..." : "Enviar enlace mágico"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Recibirás un enlace por correo para iniciar sesión sin contraseña.
        </p>
      </div>
    </div>
  );
}
