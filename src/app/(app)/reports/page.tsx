"use client";

import { useEffect, useState } from "react";
import { getDashboard, formatMoney, TX_KIND_LABELS } from "../../../lib/api";

export default function ReportsPage() {
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
      <h1 className="text-xl font-bold text-white">Reportes</h1>

      {/* Resumen del periodo */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Resumen general</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Ingresos totales</p>
            <p className="text-lg font-bold text-emerald-400">{formatMoney(data.incomeTotal, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Gastos totales</p>
            <p className="text-lg font-bold text-rose-400">{formatMoney(data.expenseTotal, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Balance neto</p>
            <p className={`text-lg font-bold ${data.balance >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
              {formatMoney(data.balance, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Gastos por categoría */}
      {data.expensesByCategory && data.expensesByCategory.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Gastos por categoría</h2>
          <div className="space-y-3">
            {data.expensesByCategory.map((cat: any) => (
              <div key={cat.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{cat.category}</span>
                  <span className="text-white font-medium">{formatMoney(cat.amount, currency)}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{cat.percentage.toFixed(1)}% del total</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saldos de cuentas */}
      {data.accountBalances && data.accountBalances.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Saldos por cuenta</h2>
          <div className="space-y-2">
            {data.accountBalances.map((acc: any) => (
              <div key={acc.account_id} className="flex justify-between py-1 border-b border-slate-800 last:border-0">
                <span className="text-sm text-slate-400">{acc.account_name}</span>
                <span className="text-sm font-medium text-white">{formatMoney(acc.current_balance, acc.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Todos los movimientos */}
      {data.recentTransactions && data.recentTransactions.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Todos los movimientos</h2>
          <div className="space-y-2">
            {data.recentTransactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{tx.description || TX_KIND_LABELS[tx.kind] || tx.kind}</p>
                  <p className="text-xs text-slate-500">{new Date(tx.transaction_date).toLocaleDateString("es-MX")}</p>
                </div>
                <span className={`text-sm font-semibold ml-4 ${tx.direction === "in" ? "text-emerald-400" : "text-rose-400"}`}>
                  {tx.direction === "in" ? "+" : "-"}{formatMoney(tx.amount, tx.currency || currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}