// lib/checkOwner.ts
export const OWNER_EMAIL = "info@tech4ru.com";

export function isOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  // Trim whitespace and compare case-insensitively
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOwner = OWNER_EMAIL.toLowerCase();
  return normalizedEmail === normalizedOwner;
}
