import { supabase } from "./supabase";

export async function signOutUser() {
  try {
    // 1. Sign out from Supabase (this clears the server session)
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      console.error("Sign out error:", error);
    }

    // 2. Clear ALL localStorage keys (supabase + sb- prefix)
    clearAuthStorage();

    // 3. Clear ALL sessionStorage keys
    clearSessionStorage();

    // 4. Clear cookies manually (belt + suspenders)
    clearAuthCookies();

    return { success: true };
  } catch (err) {
    console.error("Sign out exception:", err);
    // Still try to clear storage even if signOut throws
    clearAuthStorage();
    clearSessionStorage();
    clearAuthCookies();
    return { success: false, error: "Failed to sign out" };
  }
}

export function clearAuthStorage() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error("Error clearing localStorage:", e);
  }
}

export function clearSessionStorage() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (e) {
    console.error("Error clearing sessionStorage:", e);
  }
}

export function clearAuthCookies() {
  try {
    // Clear all sb- prefixed cookies
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (name.startsWith("sb-") || name.includes("supabase")) {
        // Expire cookie on all possible paths/domains
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
      }
    });
  } catch (e) {
    console.error("Error clearing cookies:", e);
  }
}
