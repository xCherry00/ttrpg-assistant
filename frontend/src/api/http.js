// Use localhost:8080 as API base URL (backend runs in Docker on port 8080)
const API_URL = "http://localhost:8080";

/**
 * HTTP client for API requests with built-in error handling.
 * Automatically includes Authorization header when token is provided.
 *
 * @param {string} path - API endpoint path (e.g., "/api/auth/login")
 * @param {Object} options - Request options
 * @param {string} [options.method="GET"] - HTTP method
 * @param {Object} [options.body] - Request body (will be JSON stringified)
 * @param {string} [options.token] - JWT token for Authorization header
 * @returns {Promise<any>} Parsed response data
 * @throws {Error} HTTP errors with descriptive messages
 */
export async function http(path, { method = "GET", body, token } = {}) {
  const url = `${API_URL}${path}`;
  const headers = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let data;
    try {
      data = isJson
        ? await res.json()
        : await res.text();
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      data = null;
    }

    if (!res.ok) {
      const message =
        (data && data.message) ||
        (typeof data === "string" && data) ||
        `HTTP ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    // Re-throw with additional context
    if (err instanceof TypeError) {
      throw new Error("Network error: Unable to reach the server");
    }
    throw err;
  }
}
