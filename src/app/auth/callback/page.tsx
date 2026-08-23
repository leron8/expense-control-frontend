"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readAuthFragment } from "../../../lib/auth";
import { setAuthToken } from "../../../lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Procesando...");

  useEffect(() => {
    const { accessToken, type, errorDescription } = readAuthFragment(window.location.hash);

    if (accessToken) {
      setAuthToken(accessToken);
      setStatus(type === "recovery" ? "Preparando el restablecimiento..." : "Preparando tu espacio personal...");
      router.replace(type === "recovery" ? "/auth/reset-password" : "/onboarding");
      return;
    }

    setStatus(errorDescription ?? "Enlace inválido o expirado. Intenta de nuevo.");
    setTimeout(() => router.replace("/auth/login"), 3000);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <p className="text-slate-400">{status}</p>
    </div>
  );
}
