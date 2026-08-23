import { getActiveOrganizationId, getAuthToken } from "./session";

// Caja Fácil - API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type Direction = "in" | "out";
export type AccountType = "bank" | "cash" | "credit_card" | "other";
export type PaymentMethod = "cash" | "bank_transfer" | "card" | "cheque" | "other";

export type Account = {
  id: string;
  organization_id: string;
  name: string;
  account_type: AccountType;
  currency: string;
  opening_balance: number | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Category = {
  id: string;
  organization_id: string;
  name: string;
  direction: Direction;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Transaction = {
  id: string;
  organization_id: string;
  account_id: string | null;
  account_name: string | null;
  client_id: string | null;
  client_name: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  category_id: string | null;
  category_name: string | null;
  transaction_date: string;
  direction: Direction;
  kind: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: string;
  description: string | null;
  notes: string | null;
  created_at: string;
};

export type DashboardData = {
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  recentTransactions: Transaction[];
  expensesByCategory: { category: string; amount: number; percentage: number }[];
  accountBalances: { account_id: string; account_name: string; current_balance: number; currency: string }[];
};

export type AuthResponse = {
  user: { id: string | null; email: string };
  accessToken: string | null;
  requiresEmailConfirmation: boolean;
  message: string;
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const orgId = getActiveOrganizationId();

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
    const code = typeof data === "object" && data && "code" in data
      ? String((data as { code: string }).code)
      : undefined;
    throw new ApiError(message, res.status, code);
  }

  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────
export async function loginWithPassword(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerWithPassword(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
  return apiFetch<{ ok: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function updatePassword(password: string): Promise<{ ok: boolean; message: string }> {
  return apiFetch<{ ok: boolean; message: string }>("/auth/update-password", {
    method: "POST",
    body: JSON.stringify({ password }),
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
export async function listTransactions(params?: { direction?: Direction; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.direction) qs.set("direction", params.direction);
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiFetch<{ transactions: Transaction[] }>(`/api/transactions${query ? `?${query}` : ""}`);
}

export async function createTransaction(data: Record<string, unknown>) {
  return apiFetch<{ transaction: Transaction }>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(id: string, data: Record<string, unknown>) {
  return apiFetch<{ transaction: Transaction }>(`/api/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/transactions/${id}`, { method: "DELETE" });
}

// ── Dashboard ─────────────────────────────────────────────────────────
export async function getDashboard(params?: { startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set("start_date", params.startDate);
  if (params?.endDate) qs.set("end_date", params.endDate);
  const query = qs.toString();
  return apiFetch<DashboardData>(`/api/dashboard${query ? `?${query}` : ""}`);
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
  return apiFetch<{ accounts: Account[] }>("/api/accounts");
}

export async function createAccount(data: { name: string; account_type: AccountType; currency?: string; opening_balance?: number }) {
  return apiFetch<{ account: Account }>("/api/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAccount(id: string, data: Partial<{ name: string; account_type: AccountType; currency: string; opening_balance: number }>) {
  return apiFetch<{ account: Account }>(`/api/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/accounts/${id}`, { method: "DELETE" });
}

// ── Categories ────────────────────────────────────────────────────────
export async function listCategories(direction?: Direction) {
  const qs = direction ? `?direction=${direction}` : "";
  return apiFetch<{ categories: Category[] }>(`/api/categories${qs}`);
}

export async function createCategory(data: { name: string; direction: Direction }) {
  return apiFetch<{ category: Category }>("/api/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: Partial<{ name: string; direction: Direction }>) {
  return apiFetch<{ category: Category }>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/categories/${id}`, { method: "DELETE" });
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

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: "Banco",
  cash: "Efectivo",
  credit_card: "Tarjeta de crédito",
  other: "Otra",
};

export const DIRECTION_LABELS: Record<Direction, string> = {
  in: "Ingreso",
  out: "Gasto",
};
