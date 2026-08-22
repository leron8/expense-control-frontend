const TOKEN_KEY = "cf_token";
const ORGANIZATION_ID_KEY = "cf_org_id";

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getAuthToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function setAuthToken(token: string): void {
  storage()?.setItem(TOKEN_KEY, token);
}

export function getActiveOrganizationId(): string | null {
  return storage()?.getItem(ORGANIZATION_ID_KEY) ?? null;
}

export function setActiveOrganizationId(organizationId: string): void {
  storage()?.setItem(ORGANIZATION_ID_KEY, organizationId);
}

export function clearSession(): void {
  const currentStorage = storage();
  currentStorage?.removeItem(TOKEN_KEY);
  currentStorage?.removeItem(ORGANIZATION_ID_KEY);
}
