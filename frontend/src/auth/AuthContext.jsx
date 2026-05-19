import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, getToken, setToken as persistToken } from "./authstorage";

const AuthContext = createContext(null);

/**
 * AuthProvider component that manages authentication state.
 * Provides login, logout, and token management functionality.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return getToken();
  });

  useEffect(() => {
    if (token) {
      persistToken(token);
    } else {
      clearToken();
    }
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => setToken("");
    window.addEventListener("ttrpg:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("ttrpg:unauthorized", handleUnauthorized);
  }, []);

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
    [token, isLoggedIn]
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
