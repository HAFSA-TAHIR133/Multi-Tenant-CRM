import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { authApi } from "../api/authApi";
import { useTenant } from "@/context/TenantContext.jsx";
import { AUTH_UPDATED_EVENT } from "@/api/fetchApiHelper.jsx";

export const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

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
  
  // Ref to hold the idle timeout ID across renders
  const inactivityTimerRef = useRef(null);

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
      if (current.user) {
        setUser(current.user);
      }
    };

    window.addEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, handleAuthUpdated);
  }, [clearTenant]);

  // Handle 15-minute Inactivity Timeout
  useEffect(() => {
    // Only set up activity tracking if user is logged in
    if (!user || !accessToken) return;

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        authApi.logout();
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