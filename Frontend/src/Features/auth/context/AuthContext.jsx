import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { authApi } from "../api/authApi";
import { useTenant } from "@/context/TenantContext.jsx";
import { AUTH_UPDATED_EVENT } from "@/api/fetchApiHelper.jsx";
import {
  deriveTenantFromLoginPayload,
  enrichUserWithTenant,
  normalizeTenantFromUser,
  readStoredAuth,
  resolveTenantForSession,
} from "../utils/tenantDisplay.js";

export const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function persistAuthSession({ user, accessToken, activeTenant }) {
  if (!user || !accessToken) return;

  const resolvedTenant = resolveTenantForSession(user, activeTenant, accessToken);

  localStorage.setItem(
    "auth",
    JSON.stringify({
      user,
      accessToken,
      activeTenant: resolvedTenant,
    })
  );
}

export const AuthProvider = ({ children }) => {
  const initialAuth = readStoredAuth();
  const initialTenant = initialAuth
    ? resolveTenantForSession(
        initialAuth.user,
        initialAuth.activeTenant ?? initialAuth.tenant,
        initialAuth.accessToken
      )
    : null;

  const [user, setUser] = useState(() =>
    enrichUserWithTenant(initialAuth?.user, initialTenant, initialAuth?.accessToken)
  );
  const [accessToken, setAccessToken] = useState(initialAuth?.accessToken || null);
  const [isLoading, setIsLoading] = useState(false);

  const { activeTenant, setActiveTenant, clearTenant } = useTenant();

  const inactivityTimerRef = useRef(null);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout request failed (session may already be expired):", err);
    } finally {
      setUser(null);
      setAccessToken(null);
      clearTenant();
      localStorage.removeItem("auth");

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  }, [clearTenant]);

  useEffect(() => {
    if (user && accessToken) {
      persistAuthSession({ user, accessToken, activeTenant });
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

      const storedTenant = resolveTenantForSession(
        current.user,
        current.activeTenant ?? current.tenant,
        current.accessToken
      );

      setAccessToken(current.accessToken);

      if (current.user) {
        setUser(
          enrichUserWithTenant(current.user, storedTenant, current.accessToken)
        );
      }

      if (storedTenant) {
        setActiveTenant(storedTenant);
      } else {
        clearTenant();
      }
    };

    window.addEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
  }, [clearTenant, setActiveTenant]);

  useEffect(() => {
    if (!user || !accessToken) return;

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    resetInactivityTimer();

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [user, accessToken, logout]);

  const establishSession = (data) => {
    const nextUser = data.user || null;
    const nextAccessToken = data.accessToken || data.token || null;
    const nextTenant = deriveTenantFromLoginPayload(data);

    clearTenant();

    const enrichedUser = enrichUserWithTenant(
      nextUser,
      nextTenant,
      nextAccessToken
    );

    setUser(enrichedUser);
    setAccessToken(nextAccessToken);

    if (nextTenant) {
      setActiveTenant(nextTenant);
    }

    persistAuthSession({
      user: enrichedUser,
      accessToken: nextAccessToken,
      activeTenant: nextTenant,
    });

    return {
      ...data,
      user: enrichedUser,
      activeTenant: nextTenant ?? normalizeTenantFromUser(enrichedUser),
    };
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

  const updateUser = useCallback(
    (nextUserOrUpdater) => {
      setUser((prev) => {
        const nextUser =
          typeof nextUserOrUpdater === "function"
            ? nextUserOrUpdater(prev)
            : nextUserOrUpdater;

        return enrichUserWithTenant(nextUser, activeTenant, accessToken);
      });
    },
    [activeTenant, accessToken]
  );

  const refreshSession = useCallback(async () => {
    const data = await authApi.refresh();
    const nextAccessToken = data.accessToken || data.token;
    setAccessToken(nextAccessToken);

    const stored = safeParse(localStorage.getItem("auth")) || {};
    const resolvedTenant = resolveTenantForSession(
      stored.user,
      stored.activeTenant,
      nextAccessToken
    );

    localStorage.setItem(
      "auth",
      JSON.stringify({
        ...stored,
        accessToken: nextAccessToken,
        activeTenant: resolvedTenant,
      })
    );

    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser: updateUser,
      accessToken,
      activeTenant,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      googleLogin,
      logout,
      refreshSession,
    }),
    [user, accessToken, activeTenant, isLoading, login, googleLogin, logout, refreshSession, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
