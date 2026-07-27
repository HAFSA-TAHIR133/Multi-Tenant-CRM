import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { useTenant } from "@/context/TenantContext.jsx";

export const AuthContext = createContext(null);

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const storedAuth = safeParse(localStorage.getItem("auth"));

  const [user, setUser] = useState(storedAuth?.user || null);
  const [accessToken, setAccessToken] = useState(
    storedAuth?.accessToken || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const { activeTenant, setActiveTenant, clearTenant } = useTenant();

  /**
   * Persist auth data
   * Refresh token is NOT stored in localStorage anymore.
   */
  useEffect(() => {
    if (user || accessToken || activeTenant) {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user,
          accessToken,
          activeTenant,
        })
      );
    } else {
      localStorage.removeItem("auth");
    }
  }, [user, accessToken, activeTenant]);

  /**
   * Login
   */
  const login = async (credentials) => {
    setIsLoading(true);

    try {
      const response = await authApi.login(credentials);

      const data = response.data;

      const nextUser = data.user || null;
      const nextAccessToken = data.accessToken || data.token || null;

      const nextTenant =
        data.activeTenant ||
        data.tenant ||
        nextUser?.tenant ||
        nextUser?.tenantId ||
        null;

      setUser(nextUser);
      setAccessToken(nextAccessToken);

      if (nextTenant) {
        setActiveTenant(nextTenant);
      }

      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: nextUser,
          accessToken: nextAccessToken,
          activeTenant: nextTenant,
        })
      );

      return data;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      setAccessToken(null);

      clearTenant();

      localStorage.removeItem("auth");
    }
  };

  /**
   * Manual Refresh
   * (fetchApiHelper will normally handle this automatically)
   */
  const refreshSession = async () => {
    const data = await authApi.refresh();

    const nextAccessToken = data.accessToken || data.token;

    setAccessToken(nextAccessToken);

    const stored = safeParse(localStorage.getItem("auth")) || {};

    localStorage.setItem(
      "auth",
      JSON.stringify({
        ...stored,
        accessToken: nextAccessToken,
      })
    );

    return data;
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      activeTenant,

      isAuthenticated: !!user && !!accessToken,

      isLoading,

      login,
      logout,
      refreshSession,
    }),
    [user, accessToken, activeTenant, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
};