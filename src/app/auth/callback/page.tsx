"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "../../../lib/api";
import { clearSession, setActiveOrganizationId, setAuthToken } from "../../../lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Procesando...");

  useEffect(() => {
    // El hash de Supabase viene en la URL después del redirect
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const token = params.get("access_token");
      if (token) {
        setAuthToken(token);
        setStatus("¡Sesión iniciada! Redirigiendo...");
        // getMe uses the configured backend API URL and the stored bearer token.
        getMe()
          .then((data) => {
            if (data.organizations && data.organizations.length > 0) {
              setActiveOrganizationId(data.organizations[0].id);
              router.push("/");
            } else {
              router.push("/onboarding");
            }
          })
          .catch(() => {
            clearSession();
            router.push("/auth/login");
          });
        return;
      }
    }
    setStatus("Enlace inválido o expirado. Intenta de nuevo.");
    setTimeout(() => router.push("/auth/login"), 3000);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <p className="text-slate-400">{status}</p>
    </div>
  );
}
