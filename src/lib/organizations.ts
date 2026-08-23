import { getMe } from "./api";
import { getActiveOrganizationId, setActiveOrganizationId } from "./session";

type OrganizationSummary = Awaited<ReturnType<typeof getMe>>["organizations"][number];

const SESSION_ERROR_MESSAGES = new Set([
  "Missing Authorization header.",
  "Missing or invalid Authorization header. Use: Bearer <token>",
  "Invalid or expired token.",
]);

export function selectActiveOrganization(organizations: OrganizationSummary[]): OrganizationSummary | null {
  const storedOrganizationId = getActiveOrganizationId();

  if (storedOrganizationId) {
    const storedOrganization = organizations.find((organization) => organization.id === storedOrganizationId);
    if (storedOrganization) {
      return storedOrganization;
    }
  }

  return organizations[0] ?? null;
}

export async function initializeActiveOrganization(): Promise<OrganizationSummary> {
  const data = await getMe();
  const activeOrganization = selectActiveOrganization(data.organizations);

  if (!activeOrganization) {
    throw new Error("No pudimos encontrar un espacio de trabajo disponible.");
  }

  setActiveOrganizationId(activeOrganization.id);
  return activeOrganization;
}

export function shouldResetSession(error: unknown): boolean {
  return error instanceof Error && SESSION_ERROR_MESSAGES.has(error.message);
}

export function getWorkspaceSetupErrorMessage(_error: unknown): string {
  return "No pudimos preparar tu espacio personal. Intenta nuevamente.";
}
