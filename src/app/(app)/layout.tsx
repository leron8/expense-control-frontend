"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, DollarSign, CreditCard, Users, Building2, FileText, LogOut } from "lucide-react";
import { clearSession } from "../../lib/session";

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/income", label: "Ingresos", icon: DollarSign },
  { href: "/expenses", label: "Gastos", icon: CreditCard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/suppliers", label: "Proveedores", icon: Building2 },
  { href: "/reports", label: "Reportes", icon: FileText },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push("/auth/login");
  }

  return (
    <div className="app-shell">
      {/* Sidebar - desktop */}
      <aside className="sidebar-desktop">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-white">Caja Fácil</h1>
          <p className="text-xs text-slate-500 mt-1">Control financiero</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-300"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-sm text-slate-500 hover:text-rose-400 transition w-full">
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="content-area">
        {children}
      </main>

      {/* Bottom nav - mobile */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "active" : ""}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
