"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createOrganization } from "../../lib/api";
import { setActiveOrganizationId } from "../../lib/session";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createOrganization(name);
      setActiveOrganizationId(result.organization.id);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el negocio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">¡Bienvenido a Caja Fácil!</h1>
          <p className="mt-2 text-sm text-slate-400">Crea tu negocio para empezar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de tu negocio"
            required
            minLength={2}
          />

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button type="submit" disabled={loading || !name.trim()} className="primary">
            {loading ? "Creando..." : "Crear mi negocio"}
          </button>
        </form>
      </div>
    </div>
  );
}
