// lib/checkOwner.ts
export const OWNER_EMAIL = "info@tech4ru.com";

export function isOwner(email: string | null | undefined): boolean {
  if (!email) {
    console.log("🔴 isOwner: No email provided");
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOwner = OWNER_EMAIL.toLowerCase();
  const result = normalizedEmail === normalizedOwner;

  // ✅ Debug log
  console.log(`🔍 isOwner Check:`);
  console.log(`   Email: "${normalizedEmail}"`);
  console.log(`   Owner: "${normalizedOwner}"`);
  console.log(`   Result: ${result}`);

  return result;
}
