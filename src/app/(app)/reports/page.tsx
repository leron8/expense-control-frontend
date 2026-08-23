"use client";

import { useEffect, useState } from "react";
import { getDashboard, formatMoney, TX_KIND_LABELS } from "../../../lib/api";
import { formatDateForMexico, getCurrentMonthRange } from "../../../lib/dates";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [filters, setFilters] = useState(() => getCurrentMonthRange());

  useEffect(() => {
    if (filters.startDate > filters.endDate) {
      setRangeError("La fecha inicial no puede ser mayor que la fecha final.");
      setLoading(false);
      return;
    }

    setRangeError(null);
    setLoading(true);
    setError(null);

    getDashboard({ startDate: filters.startDate, endDate: filters.endDate })
      .then(setData)
      .catch((nextError) => setError(nextError.message))
      .finally(() => setLoading(false));
  }, [filters.endDate, filters.startDate]);

  const currency = data?.recentTransactions?.[0]?.currency || "MXN";
  const hasData = Boolean(data);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Reportes</h1>

      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-300">Rango del reporte</h2>
          <p className="mt-1 text-xs text-slate-500">
            Ajusta el periodo para recalcular ingresos, gastos y balance.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Desde</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
            />
            <span className="mt-2 block text-xs text-slate-500">{formatDateForMexico(filters.startDate)}</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Hasta</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
            />
            <span className="mt-2 block text-xs text-slate-500">{formatDateForMexico(filters.endDate)}</span>
          </label>
        </div>
      </div>

      {rangeError && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          {rangeError}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-rose-300">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-xl bg-slate-800/50" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-800/50" />
        </div>
      )}

      {!loading && hasData && (
        <>
          {/* Resumen del periodo */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-300">Resumen general</h2>
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
              <h2 className="mb-3 text-sm font-semibold text-slate-300">Gastos por categoría</h2>
              <div className="space-y-3">
                {data.expensesByCategory.map((cat: any) => (
                  <div key={cat.category}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-400">{cat.category}</span>
                      <span className="font-medium text-white">{formatMoney(cat.amount, currency)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{cat.percentage.toFixed(1)}% del total</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saldos de cuentas */}
          {data.accountBalances && data.accountBalances.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-300">Saldos por cuenta</h2>
              <div className="space-y-2">
                {data.accountBalances.map((acc: any) => (
                  <div key={acc.account_id} className="flex justify-between border-b border-slate-800 py-1 last:border-0">
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
              <h2 className="mb-3 text-sm font-semibold text-slate-300">Todos los movimientos</h2>
              <div className="space-y-2">
                {data.recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-slate-800 py-2 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{tx.description || TX_KIND_LABELS[tx.kind] || tx.kind}</p>
                      <p className="text-xs text-slate-500">{formatDateForMexico(tx.transaction_date)}</p>
                    </div>
                    <span className={`ml-4 text-sm font-semibold ${tx.direction === "in" ? "text-emerald-400" : "text-rose-400"}`}>
                      {tx.direction === "in" ? "+" : "-"}{formatMoney(tx.amount, tx.currency || currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && data?.recentTransactions?.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 text-center text-sm text-slate-500">
          No hay movimientos en el rango seleccionado.
        </div>
      )}
    </div>
  );
}
