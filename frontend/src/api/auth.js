import { http } from "./http";
import { clearToken } from "../auth/authstorage";

const CACHE_KEY = "ttrpg_initiative_rows_v1";

/**
 * Login with email and password.
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string, role: string}>} Authentication response with token and role
 * @throws {Error} If authentication fails
 */
export async function login(email, password) {
  return http("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/**
 * Register a new user.
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string, role: string}>} Authentication response with token and role
 * @throws {Error} If registration fails (e.g., email already exists)
 */
export async function register(email, password) {
  return http("/api/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export async function forgotPassword(email) {
  return http("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token, newPassword) {
  return http("/api/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

/**
 * Clear all authentication-related data from storage.
 * Called on logout to clean up cache and credentials.
 */
export function logout() {
  clearToken();
  sessionStorage.removeItem(CACHE_KEY);
}
