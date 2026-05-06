import { http } from "./http";

/**
 * Fetch current user information
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Object>} User object with id, email, and role
 * @throws {Error} If the request fails or user is not authenticated
 */
export async function getMe(token) {
  if (!token) {
    throw new Error("Authentication token is required");
  }
  
  return http("/api/me", { 
    method: "GET",
    token 
  });
}
