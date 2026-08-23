"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
  createAccount,
  deleteAccount,
  formatMoney,
  listAccounts,
  updateAccount,
} from "../../lib/api";
import { ManagerDialog } from "./manager-dialog";

type AccountManagerDialogProps = {
  open: boolean;
  onClose: () => void;
  closeOnCreate?: boolean;
  onCollectionChange?: (accounts: Account[]) => void;
  onCreated?: (account: Account) => void;
};

type AccountFormState = {
  name: string;
  account_type: AccountType;
  currency: string;
  opening_balance: string;
};

const INITIAL_FORM: AccountFormState = {
  name: "",
  account_type: "cash",
  currency: "MXN",
  opening_balance: "0",
};

export function AccountManagerDialog({
  open,
  onClose,
  closeOnCreate = false,
  onCollectionChange,
  onCreated,
}: AccountManagerDialogProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<AccountFormState>(INITIAL_FORM);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAccounts(showLoader = false) {
    if (showLoader) setLoading(true);
    try {
      const data = await listAccounts();
      setAccounts(data.accounts);
      onCollectionChange?.(data.accounts);
      return data.accounts;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Error al cargar cuentas");
      return null;
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingAccountId(null);
  }

  useEffect(() => {
    if (!open) {
      resetForm();
      setError(null);
      return;
    }

    void loadAccounts(true);
  }, [open]);

  function startEditing(account: Account) {
    setEditingAccountId(account.id);
    setForm({
      name: account.name,
      account_type: account.account_type,
      currency: account.currency,
      opening_balance: String(account.opening_balance ?? 0),
    });
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const currency = form.currency.trim().toUpperCase() || "MXN";
    const openingBalance = Number(form.opening_balance);

    if (!name) {
      setError("El nombre de la cuenta es obligatorio.");
      return;
    }

    if (Number.isNaN(openingBalance)) {
      setError("El saldo inicial debe ser un número válido.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        account_type: form.account_type,
        currency,
        opening_balance: openingBalance,
      };

      if (editingAccountId) {
        await updateAccount(editingAccountId, payload);
        await loadAccounts();
        resetForm();
      } else {
        const { account } = await createAccount(payload);
        await loadAccounts();
        resetForm();
        onCreated?.(account);

        if (closeOnCreate) {
          onClose();
        }
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Error al guardar cuenta");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(account: Account) {
    if (!confirm(`¿Eliminar la cuenta "${account.name}"?`)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteAccount(account.id);
      await loadAccounts();

      if (editingAccountId === account.id) {
        resetForm();
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Error al eliminar cuenta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ManagerDialog
      open={open}
      onClose={onClose}
      title="Administrar cuentas"
      description="Crea, edita o elimina cuentas sin salir del flujo de captura."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Cuentas activas</h3>
              <p className="text-xs text-slate-500">Se actualizan al guardar o eliminar.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-800/60" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
              Todavía no hay cuentas registradas.
            </p>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{account.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {ACCOUNT_TYPE_LABELS[account.account_type]} · {formatMoney(Number(account.opening_balance), account.currency)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(account)}
                      className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(account)}
                      disabled={saving}
                      className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-sm font-semibold text-slate-200">
            {editingAccountId ? "Editar cuenta" : "Nueva cuenta"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Reutiliza esta cuenta de inmediato en ingresos o gastos.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nombre de la cuenta"
              required
            />

            <select
              value={form.account_type}
              onChange={(event) => setForm((current) => ({ ...current, account_type: event.target.value as AccountType }))}
            >
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <input
              value={form.currency}
              onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
              placeholder="Moneda"
              maxLength={12}
              required
            />

            <input
              value={form.opening_balance}
              onChange={(event) => setForm((current) => ({ ...current, opening_balance: event.target.value }))}
              placeholder="Saldo inicial"
              type="number"
              step="0.01"
              required
            />

            <button type="submit" disabled={saving} className="primary">
              {saving ? "Guardando..." : editingAccountId ? "Actualizar cuenta" : "Guardar cuenta"}
            </button>

            {editingAccountId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-full border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                Cancelar edición
              </button>
            )}
          </form>
        </section>
      </div>
    </ManagerDialog>
  );
}
