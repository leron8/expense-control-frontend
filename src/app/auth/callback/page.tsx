"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        localStorage.setItem("cf_token", token);
        setStatus("¡Sesión iniciada! Redirigiendo...");
        // Verificar si tiene organizaciones
        fetch("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.organizations && data.organizations.length > 0) {
              localStorage.setItem("cf_org_id", data.organizations[0].id);
              router.push("/");
            } else {
              router.push("/onboarding");
            }
          })
          .catch(() => router.push("/onboarding"));
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