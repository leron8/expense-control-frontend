import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caja Fácil",
  description: "Control financiero simple para tu negocio",
  manifest: "/manifest.json",
  themeColor: "#020617",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Caja Fácil" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}