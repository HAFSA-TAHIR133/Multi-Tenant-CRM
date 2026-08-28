import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { authApi } from "../api/authApi";
import { useTenant } from "@/context/TenantContext.jsx";
import { AUTH_UPDATED_EVENT } from "@/api/fetchApiHelper.jsx";
import {
  enrichUserWithTenant,
  readStoredAuth,
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

  const currentAuth = readStoredAuth() || {};
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

export const AuthProvider = ({ children }) => {
  const initialAuth = readStoredAuth();
  const initialTenant =
    initialAuth?.activeTenant ?? initialAuth?.tenant ?? initialAuth?.user?.tenant ?? null;

  const [user, setUser] = useState(() =>
    enrichUserWithTenant(initialAuth?.user, initialTenant, initialAuth?.accessToken)
  );
  const [accessToken, setAccessToken] = useState(initialAuth?.accessToken || null);
  const [isLoading, setIsLoading] = useState(false);

  const { activeTenant, setActiveTenant, clearTenant } = useTenant();

  // Ref to hold the idle timeout ID across renders
  const inactivityTimerRef = useRef(null);

  // Re-hydrate auth/tenant state after hard reloads (common on Vercel SPA entry).
  useEffect(() => {
    const stored = readStoredAuth();
    if (!stored?.accessToken) return;

    const storedTenant =
      stored.activeTenant ?? stored.tenant ?? stored.user?.tenant ?? null;

    const hydratedUser = enrichUserWithTenant(
      stored.user,
      storedTenant,
      stored.accessToken
    );

    setAccessToken(stored.accessToken);
    if (hydratedUser) {
      setUser(hydratedUser);
    }
    if (storedTenant) {
      setActiveTenant(storedTenant);
    }
  }, [setActiveTenant]);

  // Centralized logout function (clears backend session + frontend state)
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout request failed (session may already be expired):", err);
    } finally {
      // Clear React Context state
      setUser(null);
      setAccessToken(null);
      
      // Clear Tenant Context state
      clearTenant();
      
      // Clear local storage
      localStorage.removeItem("auth");

      // Clear any pending inactivity timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  }, [clearTenant]);

  // Keep localStorage sync centralized
  useEffect(() => {
    if (user && accessToken) {
      persistAuthSession({ user, accessToken, activeTenant });
    }
  }, [user, accessToken, activeTenant]);

  // Sync state with global auth update events
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

      const storedTenant =
        current.activeTenant ?? current.tenant ?? current.user?.tenant ?? null;

      if (current.user) {
        setUser(
          enrichUserWithTenant(current.user, storedTenant, current.accessToken)
        );
      }

      if (storedTenant) {
        setActiveTenant(storedTenant);
      }
    };

    window.addEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
  }, [clearTenant, setActiveTenant]);

  // Handle 15-minute Inactivity Timeout
  useEffect(() => {
    // Only set up activity tracking if user is logged in
    if (!user || !accessToken) return;

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        logout(); // FIXED: Triggers full context & local storage cleanup
      }, INACTIVITY_TIMEOUT);
    };

    // User interaction events to track activity
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    // Initialize timer immediately on mount/login
    resetInactivityTimer();

    // Attach listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Cleanup listeners and timer on unmount or logout
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

    const nextTenant =
      data.activeTenant ||
      data.tenant ||
      nextUser?.tenant ||
      nextUser?.tenantId ||
      null;

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
      setUser, // FIXED: Now exposed for Profile and Avatar state updates
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