"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listTransactions, createTransaction, deleteTransaction, formatMoney, TX_KIND_LABELS, listAccounts, listCategories } from "../../../lib/api";

export default function IncomePage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", account_id: "", category_id: "", payment_method: "cash" });

  async function load() {
    setLoading(true);
    try {
      const [txData, accData, catData] = await Promise.all([
        listTransactions({ direction: "in" }),
        listAccounts(),
        listCategories("in"),
      ]);
      setTransactions(txData.transactions);
      setAccounts(accData.accounts);
      setCategories(catData.categories);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createTransaction({
        description: form.description || null,
        amount: Number(form.amount),
        direction: "in",
        kind: "client_income",
        account_id: form.account_id || null,
        category_id: form.category_id || null,
        payment_method: form.payment_method,
      });
      setForm({ description: "", amount: "", account_id: "", category_id: "", payment_method: "cash" });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Ingresos</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {error && <div className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" required />
          <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Monto" type="number" step="0.01" required />
          <select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} required>
            <option value="">Seleccionar cuenta</option>
            {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Sin categoría</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
            <option value="cash">Efectivo</option>
            <option value="bank_transfer">Transferencia</option>
            <option value="card">Tarjeta</option>
            <option value="cheque">Cheque</option>
            <option value="other">Otro</option>
          </select>
          <button type="submit" disabled={saving} className="primary">{saving ? "Guardando..." : "Guardar ingreso"}</button>
        </form>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <p className="text-xs text-slate-500">Total ingresos</p>
        <p className="text-2xl font-bold text-emerald-400">{formatMoney(total)}</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No hay ingresos registrados</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div>
                  <p className="text-sm font-medium text-white">{tx.description || TX_KIND_LABELS[tx.kind]}</p>
                  <p className="text-xs text-slate-500">{new Date(tx.transaction_date).toLocaleDateString("es-MX")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-emerald-400">{formatMoney(tx.amount, tx.currency)}</span>
                  <button onClick={() => { if (confirm("¿Eliminar?")) deleteTransaction(tx.id).then(load); }} className="text-xs text-rose-400 hover:text-rose-300">✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}