// lib/checkOwner.ts
export const OWNER_EMAIL = "info@tech4ru.com";

export function isOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}
