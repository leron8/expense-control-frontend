"use client";

import { useEffect, useState } from "react";
import { getDashboard, formatMoney, TX_KIND_LABELS } from "../../lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-rose-300">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const currency = data.recentTransactions?.[0]?.currency || "MXN";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Panel de Control</h1>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-400">Ingresos</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatMoney(data.incomeTotal, currency)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wider text-rose-400">Gastos</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatMoney(data.expenseTotal, currency)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs uppercase tracking-wider text-cyan-400">Balance</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatMoney(data.balance, currency)}</p>
        </div>
      </div>

      {/* Gastos por categoría */}
      {data.expensesByCategory && data.expensesByCategory.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Gastos por categoría</h2>
          <div className="space-y-2">
            {data.expensesByCategory.slice(0, 5).map((cat: any) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{cat.category}</span>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-white w-20 text-right">{formatMoney(cat.amount, currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transacciones recientes */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Movimientos recientes</h2>
        <div className="space-y-2">
          {data.recentTransactions && data.recentTransactions.length > 0 ? (
            data.recentTransactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{tx.description || TX_KIND_LABELS[tx.kind] || tx.kind}</p>
                  <p className="text-xs text-slate-500">{new Date(tx.transaction_date).toLocaleDateString("es-MX")}</p>
                </div>
                <span className={`text-sm font-semibold ml-4 ${tx.direction === "in" ? "text-emerald-400" : "text-rose-400"}`}>
                  {tx.direction === "in" ? "+" : "-"}{formatMoney(tx.amount, tx.currency || currency)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 py-4 text-center">No hay movimientos aún. Agrega tu primer ingreso o gasto.</p>
          )}
        </div>
      </div>

      {/* Saldos de cuentas */}
      {data.accountBalances && data.accountBalances.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Saldos</h2>
          <div className="space-y-2">
            {data.accountBalances.map((acc: any) => (
              <div key={acc.account_id} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-400">{acc.account_name}</span>
                <span className="text-sm font-medium text-white">{formatMoney(acc.current_balance, acc.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}