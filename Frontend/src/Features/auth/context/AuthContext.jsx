import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { authApi } from "../api/authApi";
import { useTenant } from "@/context/TenantContext.jsx";
import { AUTH_UPDATED_EVENT } from "@/api/fetchApiHelper.jsx";

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
  const [accessToken, setAccessToken] = useState(storedAuth?.accessToken || null);
  const [isLoading, setIsLoading] = useState(false);

  const { activeTenant, setActiveTenant, clearTenant } = useTenant();

  // Keep localStorage sync centralized without accidental deletes
  useEffect(() => {
    if (user && accessToken) {
      const currentAuth = safeParse(localStorage.getItem("auth")) || {};
      localStorage.setItem(
        "auth",
        JSON.stringify({
          ...currentAuth,
          user,
          accessToken,
          activeTenant: activeTenant || currentAuth.activeTenant || null,
        })
      );
    }
  }, [user, accessToken, activeTenant]);

  useEffect(() => {
    const handleAuthUpdated = () => {
      const current = safeParse(localStorage.getItem("auth"));

      if (!current?.accessToken) {
        setUser(null);
        setAccessToken(null);
        clearTenant();
        return;
      }

      setAccessToken(current.accessToken);
      if (current.user) {
        setUser(current.user);
      }
    };

    window.addEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
  }, [clearTenant]);

  const establishSession = (data) => {
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

    return data;
  };

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      return establishSession(response.data);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (credential) => {
    setIsLoading(true);
    try {
      const response = await authApi.googleLogin(credential);
      return establishSession(response.data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setAccessToken(null);
      clearTenant();
      localStorage.removeItem("auth");
    }
  }, [clearTenant]);

  const refreshSession = useCallback(async () => {
    const data = await authApi.refresh();
    const nextAccessToken = data.accessToken || data.token;
    setAccessToken(nextAccessToken);

    const stored = safeParse(localStorage.getItem("auth")) || {};
    localStorage.setItem(
      "auth",
      JSON.stringify({ ...stored, accessToken: nextAccessToken })
    );

    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      activeTenant,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      googleLogin,
      logout,
      refreshSession,
    }),
    [user, accessToken, activeTenant, isLoading, login, googleLogin, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};