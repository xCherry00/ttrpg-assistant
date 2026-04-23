import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = "token";

/**
 * AuthProvider component that manages authentication state.
 * Provides login, logout, and token management functionality.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    // Initialize from localStorage on first render
    return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  });

  // Persist token changes to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  // Derive isLoggedIn from token (no need to store separately)
  const isLoggedIn = !!token;

  /**
   * Set the authentication token for the user
   */
  function loginWithToken(newToken) {
    setToken(newToken || "");
  }

  /**
   * Clear the authentication token (logout)
   */
  function logout() {
    setToken("");
  }

  // Memoize value to prevent unnecessary re-renders of child components
  const value = useMemo(
    () => ({ token, isLoggedIn, loginWithToken, logout }),
    [token] // Only depend on token since isLoggedIn is derived
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 * @returns {Object} Authentication context with token, isLoggedIn, loginWithToken, and logout
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
