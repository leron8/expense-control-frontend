"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card } from "./ui/Card";
import { KpiCard } from "./ui/KpiCard";
import { Skeleton } from "./ui/Skeleton";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Transaction = {
  id: string;
  company_id: string;
  type: "income" | "expense";
  amount: string;
  currency: string;
  description: string | null;
  client: string | null;
  category: string | null;
  created_at: string;
};

type ExpenseByCategory = {
  category: string;
  amount: number;
  percentage: number;
};

type DashboardSummary = {
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  recentTransactions: Transaction[];
  expensesByCategory: ExpenseByCategory[];
  payrollThisMonth: number;
  activeProjects: number;
  pendingInvoices: number;
  activeVehicles: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const DEFAULT_COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID || "";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function monthKey(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export default function Dashboard() {
  const [companyId, setCompanyId] = useState(DEFAULT_COMPANY_ID);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const currency = useMemo(() => {
    return transactions[0]?.currency ?? "MXN";
  }, [transactions]);

  async function load() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      if (!companyId) {
        setError("Configura `NEXT_PUBLIC_COMPANY_ID` (o escribe un id de empresa abajo).");
        setTransactions([]);
        setSummary(null);
        return;
      }

      const qs = `company_id=${encodeURIComponent(companyId)}`;
      const summaryRes = await fetch(`${API_BASE_URL}/dashboard?${qs}`);
      const summaryJson = await summaryRes.json();

      if (!summaryRes.ok) {
        const backendError =
          summaryJson && typeof summaryJson === "object" && "error" in summaryJson
            ? (summaryJson as { error: string }).error
            : summaryRes.statusText;
        throw new Error(`Failed to fetch dashboard summary (${summaryRes.status}): ${backendError}`);
      }

      setSummary(summaryJson as DashboardSummary);
      setTransactions((summaryJson as DashboardSummary).recentTransactions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const chartData = useMemo(() => {
    const tx = [...transactions].slice(0, 10).reverse(); // oldest -> newest
    if (tx.length === 0) return null;

    const labels = tx.map((t) => new Date(t.created_at).toLocaleDateString("es-MX"));
    const income = tx.map((t) => (t.type === "income" ? Number(t.amount) : 0));
    const expense = tx.map((t) => (t.type === "expense" ? Number(t.amount) : 0));

    return {
      labels,
      datasets: [
        {
          label: "Ingresos",
          data: income,
          backgroundColor: "rgba(34, 197, 94, 0.65)"
        },
        {
          label: "Gastos",
          data: expense,
          backgroundColor: "rgba(239, 68, 68, 0.65)"
        }
      ]
    };
  }, [transactions]);

  const recent = transactions.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-[32px] border border-slate-800 bg-slate-950 p-5 shadow-soft md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-2">
          <p className="text-sm text-cyan-300">Company ID</p>
          <input
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="UUID (company_id)"
            className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>
        <button
          onClick={() => void load()}
          className="h-14 w-full rounded-3xl bg-cyan-500 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Refresh dashboard
        </button>
      </div>

      {error ? (
        <Card className="border border-rose-500/20 bg-rose-500/5 text-rose-200">
          <p>{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : null}

      {!loading && summary ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <KpiCard label="Total Income" value={formatMoney(summary.incomeTotal, currency)} metric="Monthly" />
          <KpiCard label="Total Expenses" value={formatMoney(summary.expenseTotal, currency)} metric="Monthly" />
          <KpiCard label="Net Balance" value={formatMoney(summary.balance, currency)} metric="Monthly" />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Trend</p>
              <h2 className="mt-3 text-xl font-semibold text-white">Income vs Expenses</h2>
            </div>
            <span className="rounded-3xl bg-slate-900 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-400">
              30 days
            </span>
          </div>
          <div className="h-[320px]">
            {chartData ? (
              <Bar data={chartData as any} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No data available.</div>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Breakdown</p>
            <h2 className="mt-3 text-xl font-semibold text-white">Expense Summary</h2>
          </div>
          <div className="grid gap-3">
            {summary?.expensesByCategory && summary.expensesByCategory.length > 0 ? (
              summary.expensesByCategory.map((cat) => (
                <div key={cat.category} className="rounded-3xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">{cat.category}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{cat.percentage.toFixed(1)}%</p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-500">
                No expense data
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent Activity</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Latest transactions</h2>
            </div>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center text-slate-500">
                No recent activity found.
              </div>
            ) : (
              transactions.map((t) => {
                const created = new Date(t.created_at).toLocaleString("es-MX");
                const amt = Number(t.amount);
                const signColor = t.type === "income" ? "text-emerald-400" : "text-rose-400";
                const label =
                  t.description ??
                  (t.client ? `${t.type === "income" ? "Income from" : "Expense to"} ${t.client}` : t.category ?? "No description");

                return (
                  <div key={t.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{label}</p>
                        <p className="mt-1 text-xs text-slate-500">{created}</p>
                      </div>
                      <p className={`text-sm font-semibold ${signColor}`}>{formatMoney(amt, currency)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Payroll</p>
            <h2 className="mt-3 text-xl font-semibold text-white">Team payroll</h2>
            <p className="mt-4 text-sm text-slate-400">Ongoing payroll obligations across active projects.</p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-3xl bg-slate-900 p-4">
                <p className="text-sm text-slate-400">This month</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {summary?.payrollThisMonth !== undefined
                    ? formatMoney(summary.payrollThisMonth, currency)
                    : "—"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Pending invoices</p>
                <p className="mt-2 text-lg font-semibold text-white">{summary?.pendingInvoices ?? "—"}</p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Vehicles</p>
            <h2 className="mt-3 text-xl font-semibold text-white">Fleet summary</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-3xl bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Active vehicles</p>
                <p className="mt-2 text-lg font-semibold text-white">{summary?.activeVehicles ?? 0}</p>
              </div>
              <div className="rounded-3xl bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Active projects</p>
                <p className="mt-2 text-lg font-semibold text-white">{summary?.activeProjects ?? 0}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

