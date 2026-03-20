"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

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

type ReportMonth = {
  month: string;
  company_id: string;
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
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
  const [report, setReport] = useState<ReportMonth | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = useMemo(() => {
    return transactions[0]?.currency ?? "MXN";
  }, [transactions]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (!companyId) {
        setError("Set `NEXT_PUBLIC_COMPANY_ID` (or type a company id below).");
        setTransactions([]);
        setReport(null);
        return;
      }

      const now = new Date();
      const currentMonth = monthKey(now);
      const qs = `company_id=${encodeURIComponent(companyId)}`;

      const [txRes, reportRes] = await Promise.all([
        fetch(`${API_BASE_URL}/transactions?limit=12&${qs}`),
        fetch(`${API_BASE_URL}/report/month?month=${currentMonth}&${qs}`)
      ]);

      if (!txRes.ok) throw new Error(`Failed to fetch transactions (${txRes.status}).`);
      if (!reportRes.ok) throw new Error(`Failed to fetch report (${reportRes.status}).`);

      const txJson = (await txRes.json()) as { transactions: Transaction[] };
      const reportJson = (await reportRes.json()) as ReportMonth;

      setTransactions(txJson.transactions ?? []);
      setReport(reportJson);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
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
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <div style={{ minWidth: 260 }}>
          <label style={{ display: "block", color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>
            Company ID
          </label>
          <input
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="uuid company_id"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(148, 163, 184, 0.25)",
              background: "#0f172a",
              color: "#e5e7eb"
            }}
          />
        </div>
        <button
          onClick={() => void load()}
          style={{
            height: 40,
            padding: "0 14px",
            borderRadius: 10,
            border: "1px solid rgba(148, 163, 184, 0.25)",
            background: "#0f172a",
            color: "#e5e7eb",
            cursor: "pointer"
          }}
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="card" style={{ borderColor: "rgba(239, 68, 68, 0.45)" }}>
          <div style={{ color: "#fecaca" }}>{error}</div>
        </div>
      ) : null}

      {loading ? <div style={{ color: "#94a3b8" }}>Loading...</div> : null}

      {!loading && report ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <div className="card">
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Total income</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{formatMoney(report.incomeTotal, currency)}</div>
          </div>
          <div className="card">
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Total expenses</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{formatMoney(report.expenseTotal, currency)}</div>
          </div>
          <div className="card">
            <div style={{ color: "#94a3b8", fontSize: 12 }}>Balance</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{formatMoney(report.balance, currency)}</div>
          </div>
        </div>
      ) : null}

      <div style={{ height: 14 }} />

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 700 }}>Transactions chart</div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Last 10</div>
        </div>
        <div style={{ marginTop: 12 }}>
          {chartData ? (
            <Bar data={chartData as any} options={{ responsive: true, plugins: { legend: { display: true } } }} />
          ) : (
            <div style={{ color: "#94a3b8" }}>No transactions yet.</div>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Recent transactions</div>
        {recent.length === 0 ? (
          <div style={{ color: "#94a3b8" }}>No records found.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {recent.map((t) => {
              const created = new Date(t.created_at).toLocaleString("es-MX");
              const amt = Number(t.amount);
              const signColor = t.type === "income" ? "rgba(34, 197, 94, 0.95)" : "rgba(239, 68, 68, 0.95)";
              const label =
                t.description ??
                (t.client ? `${t.type === "income" ? "Ingreso de" : "Gasto de"} ${t.client}` : t.category ?? "Sin descripción");

              return (
                <div key={t.id} style={{ border: "1px solid rgba(148, 163, 184, 0.20)", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 700 }}>{label}</div>
                    <div style={{ color: signColor, fontWeight: 800 }}>{formatMoney(amt, currency)}</div>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>{created}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

