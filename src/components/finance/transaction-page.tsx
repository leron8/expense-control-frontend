"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  type Account,
  type Category,
  type Direction,
  createTransaction,
  deleteTransaction,
  formatMoney,
  listAccounts,
  listCategories,
  listTransactions,
  TX_KIND_LABELS,
} from "../../lib/api";
import { AccountManagerDialog } from "./account-manager-dialog";
import { CategoryManagerDialog } from "./category-manager-dialog";

type TransactionPageProps = {
  direction: Direction;
  title: string;
  createButtonClassName: string;
  totalTextClassName: string;
  totalLabel: string;
  emptyStateMessage: string;
  saveLabel: string;
  defaultKind: string;
};

type TransactionFormState = {
  description: string;
  amount: string;
  account_id: string;
  category_id: string;
  payment_method: "cash" | "bank_transfer" | "card" | "cheque" | "other";
};

const INITIAL_FORM: TransactionFormState = {
  description: "",
  amount: "",
  account_id: "",
  category_id: "",
  payment_method: "cash",
};

export function TransactionPage({
  direction,
  title,
  createButtonClassName,
  totalTextClassName,
  totalLabel,
  emptyStateMessage,
  saveLabel,
  defaultKind,
}: TransactionPageProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [form, setForm] = useState<TransactionFormState>(INITIAL_FORM);

  async function loadTransactionsOnly() {
    const txData = await listTransactions({ direction });
    setTransactions(txData.transactions);
  }

  async function loadLookups() {
    const [accountsData, categoriesData] = await Promise.all([
      listAccounts(),
      listCategories(direction),
    ]);

    setAccounts(accountsData.accounts);
    setCategories(categoriesData.categories);
  }

  async function loadPage() {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([loadTransactionsOnly(), loadLookups()]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [direction]);

  function syncAccounts(nextAccounts: Account[]) {
    setAccounts(nextAccounts);
    setForm((current) => (
      current.account_id && !nextAccounts.some((account) => account.id === current.account_id)
        ? { ...current, account_id: "" }
        : current
    ));
  }

  function syncCategories(nextCategories: Category[]) {
    setCategories(nextCategories);
    setForm((current) => (
      current.category_id && !nextCategories.some((category) => category.id === current.category_id)
        ? { ...current, category_id: "" }
        : current
    ));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createTransaction({
        description: form.description.trim() || null,
        amount: Number(form.amount),
        direction,
        kind: defaultKind,
        account_id: form.account_id || null,
        category_id: form.category_id || null,
        payment_method: form.payment_method,
      });

      setForm(INITIAL_FORM);
      setShowForm(false);
      await loadTransactionsOnly();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTransaction(transactionId: string) {
    if (!confirm("¿Eliminar movimiento?")) {
      return;
    }

    try {
      setError(null);
      await deleteTransaction(transactionId);
      await loadTransactionsOnly();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Error al eliminar");
    }
  }

  const total = transactions.reduce((sum: number, transaction: any) => sum + Number(transaction.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <button onClick={() => setShowForm((current) => !current)} className={createButtonClassName}>
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {error && <div className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <input
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Descripción"
            required
          />

          <input
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            placeholder="Monto"
            type="number"
            step="0.01"
            required
          />

          <div className="space-y-2">
            <select
              value={form.account_id}
              onChange={(event) => setForm((current) => ({ ...current, account_id: event.target.value }))}
              required
            >
              <option value="">Seleccionar cuenta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAccountManager(true)}
              className="text-left text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              + Administrar cuentas
            </button>
          </div>

          <div className="space-y-2">
            <select
              value={form.category_id}
              onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowCategoryManager(true)}
              className="text-left text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              + Administrar categorías
            </button>
          </div>

          <select
            value={form.payment_method}
            onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value as TransactionFormState["payment_method"] }))}
          >
            <option value="cash">Efectivo</option>
            <option value="bank_transfer">Transferencia</option>
            <option value="card">Tarjeta</option>
            <option value="cheque">Cheque</option>
            <option value="other">Otro</option>
          </select>

          <button type="submit" disabled={saving} className="primary">
            {saving ? "Guardando..." : saveLabel}
          </button>
        </form>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <p className="text-xs text-slate-500">{totalLabel}</p>
        <p className={`text-2xl font-bold ${totalTextClassName}`}>{formatMoney(total)}</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">{emptyStateMessage}</p>
          ) : (
            transactions.map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div>
                  <p className="text-sm font-medium text-white">{transaction.description || TX_KIND_LABELS[transaction.kind]}</p>
                  <p className="text-xs text-slate-500">{new Date(transaction.transaction_date).toLocaleDateString("es-MX")}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${totalTextClassName}`}>
                    {formatMoney(transaction.amount, transaction.currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteTransaction(transaction.id)}
                    className="text-xs text-rose-400 transition hover:text-rose-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AccountManagerDialog
        open={showAccountManager}
        onClose={() => setShowAccountManager(false)}
        closeOnCreate
        onCollectionChange={syncAccounts}
        onCreated={(account) => {
          setForm((current) => ({ ...current, account_id: account.id }));
        }}
      />

      <CategoryManagerDialog
        open={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        direction={direction}
        closeOnCreate
        onCollectionChange={syncCategories}
        onCreated={(category) => {
          setForm((current) => ({ ...current, category_id: category.id }));
        }}
      />
    </div>
  );
}
