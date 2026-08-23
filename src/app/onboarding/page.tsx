"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getAuthToken } from "../../lib/session";
import {
  getWorkspaceSetupErrorMessage,
  initializeActiveOrganization,
  shouldResetSession,
} from "../../lib/organizations";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function prepareWorkspace() {
    setLoading(true);
    setError(null);

    try {
      await initializeActiveOrganization();
      router.replace("/");
    } catch (currentError) {
      if (shouldResetSession(currentError)) {
        clearSession();
        router.replace("/auth/login");
        return;
      }

      setError(getWorkspaceSetupErrorMessage(currentError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/auth/login");
      return;
    }

    void prepareWorkspace();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">
            {error ? "No pudimos preparar tu espacio personal" : "Preparando tu espacio personal..."}
          </h1>
          <p className="text-sm text-slate-400">
            {error ? error : "Esto toma solo un momento y te lleva directo al dashboard."}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-800 border-t-cyan-400" />
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Creating workspace</p>
          </div>
        ) : null}

        {error ? (
          <div className="space-y-3">
            <button type="button" onClick={() => void prepareWorkspace()} className="primary">
              Intentar nuevamente
            </button>
            <button
              type="button"
              onClick={() => {
                clearSession();
                router.replace("/auth/login");
              }}
              className="w-full rounded-xl border border-slate-800 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              Volver al login
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
