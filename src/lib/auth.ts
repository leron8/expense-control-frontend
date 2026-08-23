export const MIN_PASSWORD_LENGTH = 8;

export function getPasswordValidationError(password: string): string | null {
  if (!password) {
    return "Ingresa una contrasena.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "La contrasena debe incluir al menos una letra y un numero.";
  }

  return null;
}

export function readAuthFragment(hash: string): {
  accessToken: string | null;
  type: string | null;
  errorDescription: string | null;
} {
  const params = new URLSearchParams(hash.replace(/^#/, ""));

  return {
    accessToken: params.get("access_token"),
    type: params.get("type"),
    errorDescription: params.get("error_description"),
  };
}
