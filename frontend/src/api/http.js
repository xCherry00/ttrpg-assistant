// Backend API base URL. Vite injects VITE_API_URL from .env; localhost remains the dev fallback.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export function unwrapPage(data) {
  return data && Array.isArray(data.items) ? data.items : data;
}

function mapErrorMessage(status, rawMessage) {
  const message = String(rawMessage || "").toLowerCase();

  if (status === 401) return "Sesja wygasla. Zaloguj sie ponownie.";
  if (status === 403) return "Nie masz uprawnien do tej operacji.";
  if (status === 404) return "Nie znaleziono zasobu.";
  if (status === 409) return "Konflikt danych. Odswiez widok i sprobuj ponownie.";
  if (status === 422 || status === 400) return "Niepoprawne dane formularza. Sprawdz pola i sprobuj ponownie.";
  if (status >= 500) return "Wystapil nieoczekiwany blad. Sprobuj ponownie.";

  if (!message) return "Wystapil nieoczekiwany blad. Sprobuj ponownie.";

  if (message.includes("unable to reach the server") || message.includes("network error")) {
    return "Brak polaczenia z serwerem. Sprawdz polaczenie i sprobuj ponownie.";
  }
  if (message.includes("compendium system not found")) {
    return "Nie udalo sie pobrac danych kompendium. Sprobuj ponownie za chwile.";
  }
  if (message.includes("unexpected error")) {
    return "Wystapil nieoczekiwany blad. Sprobuj ponownie.";
  }

  return "Wystapil nieoczekiwany blad. Sprobuj ponownie.";
}

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
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
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
      const rawMessage =
        (data && data.message) ||
        (typeof data === "string" && data) ||
        `HTTP ${res.status}`;
      const err = new Error(mapErrorMessage(res.status, rawMessage));
      err.status = res.status;
      err.data = data;
      err.rawMessage = rawMessage;
      console.error("API error", { path, status: res.status, rawMessage, data });
      throw err;
    }

    return data;
  } catch (err) {
    // Re-throw with additional context
    if (err instanceof TypeError) {
      throw new Error("Brak polaczenia z serwerem. Sprawdz polaczenie i sprobuj ponownie.");
    }
    throw err;
  }
}
