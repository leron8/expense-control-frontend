// Caja Fácil - API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("cf_token") : null;
  const orgId = typeof window !== "undefined" ? localStorage.getItem("cf_org_id") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (orgId) headers["x-org-id"] = orgId;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = typeof data === "object" && data && "error" in data
      ? String((data as { error: string }).error)
      : `Request failed with ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────
export async function sendMagicLink(email: string): Promise<void> {
  await apiFetch("/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function createOrganization(name: string): Promise<{ organization: { id: string; name: string; slug: string } }> {
  return apiFetch("/auth/onboarding", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getMe(): Promise<{ user: { id: string; email: string }; organizations: Array<{ id: string; name: string; slug: string; currency: string; role: string }> }> {
  return apiFetch("/auth/me");
}

// ── Transactions ──────────────────────────────────────────────────────
export async function listTransactions(params?: { direction?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.direction) qs.set("direction", params.direction);
  if (params?.limit) qs.set("limit", String(params.limit));
  return apiFetch<{ transactions: any[] }>(`/api/transactions?${qs.toString()}`);
}

export async function createTransaction(data: Record<string, unknown>) {
  return apiFetch<{ transaction: any }>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(id: string, data: Record<string, unknown>) {
  return apiFetch<{ transaction: any }>(`/api/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/transactions/${id}`, { method: "DELETE" });
}

// ── Dashboard ─────────────────────────────────────────────────────────
export async function getDashboard() {
  return apiFetch<{
    incomeTotal: number;
    expenseTotal: number;
    balance: number;
    recentTransactions: any[];
    expensesByCategory: { category: string; amount: number; percentage: number }[];
    accountBalances: { account_id: string; account_name: string; current_balance: number; currency: string }[];
  }>("/api/dashboard");
}

// ── Clients ───────────────────────────────────────────────────────────
export async function listClients() {
  return apiFetch<{ clients: any[] }>("/api/clients");
}

export async function createClient(data: { name: string; phone?: string; email?: string; notes?: string }) {
  return apiFetch<{ client: any }>("/api/clients", { method: "POST", body: JSON.stringify(data) });
}

export async function updateClient(id: string, data: Record<string, unknown>) {
  return apiFetch<{ client: any }>(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteClient(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/clients/${id}`, { method: "DELETE" });
}

// ── Suppliers ─────────────────────────────────────────────────────────
export async function listSuppliers() {
  return apiFetch<{ suppliers: any[] }>("/api/suppliers");
}

export async function createSupplier(data: { name: string; phone?: string; email?: string; notes?: string }) {
  return apiFetch<{ supplier: any }>("/api/suppliers", { method: "POST", body: JSON.stringify(data) });
}

export async function updateSupplier(id: string, data: Record<string, unknown>) {
  return apiFetch<{ supplier: any }>(`/api/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteSupplier(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/suppliers/${id}`, { method: "DELETE" });
}

// ── Accounts ──────────────────────────────────────────────────────────
export async function listAccounts() {
  return apiFetch<{ accounts: any[] }>("/api/accounts");
}

// ── Categories ────────────────────────────────────────────────────────
export async function listCategories(direction?: string) {
  const qs = direction ? `?direction=${direction}` : "";
  return apiFetch<{ categories: any[] }>(`/api/categories${qs}`);
}

// ── Format helpers ────────────────────────────────────────────────────
export function formatMoney(amount: number, currency: string = "MXN") {
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export const TX_KIND_LABELS: Record<string, string> = {
  client_income: "Ingreso de cliente",
  cash_income: "Ingreso en efectivo",
  expense: "Gasto general",
  supplier_payment: "Pago a proveedor",
  fuel_expense: "Gasolina",
  payroll_payment: "Nómina",
  bank_fee: "Comisión bancaria",
  tax_payment: "Pago de impuestos",
  internal_transfer: "Transferencia",
  adjustment: "Ajuste",
};