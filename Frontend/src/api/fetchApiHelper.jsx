const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");

// --- Auth storage helpers ---
function getAuth() {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch {
    return null;
  }
}

function setAuth(nextAuth) {
  localStorage.setItem("auth", JSON.stringify(nextAuth));
}

// --- Single-flight refresh promise ---
// Prevents multiple simultaneous 401s from triggering multiple refresh calls.
let refreshPromise = null;

// --- Event to notify AuthContext that the access token changed ---
const AUTH_UPDATED_EVENT = "auth:updated";

function notifyAuthUpdated() {
  window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT));
}

/**
 * Directly calls the refresh endpoint WITHOUT going through fetchApi.
 * This avoids infinite recursion (fetchApi would try to refresh again on 401).
 */
async function refreshAccessToken() {
  const auth = getAuth();

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const error = new Error(
      data?.message || "Unable to refresh access token"
    );
    error.status = res.status;
    throw error;
  }

  const newAccessToken = data.data?.accessToken || data.accessToken || data.token;

  if (!newAccessToken) {
    throw new Error("No access token returned.");
  }

  const nextAuth = {
    ...(auth || {}),
    accessToken: newAccessToken,
  };

  setAuth(nextAuth);

  // Notify React state (AuthContext) that the token changed
  notifyAuthUpdated();

  return newAccessToken;
}

/**
 * Single-flight wrapper: if a refresh is already in progress,
 * all callers share the same promise.
 */
function getRefreshedToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Clears auth state and notifies the app to redirect to login.
 */
function clearAuthState() {
  localStorage.removeItem("auth");
  notifyAuthUpdated();
}

// Auth endpoints should never trigger the refresh flow.
// A 401 from these means the login/refresh itself failed, not that the
// access token expired. Retrying would cause a confusing "Refresh token required".
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/google",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
];

function isAuthEndpoint(endpoint) {
  return AUTH_ENDPOINTS.some((path) => endpoint.startsWith(path));
}

export async function fetchApi(endpoint, options = {}, retrying = false) {
  const auth = getAuth();

  const token = auth?.accessToken;

  const tenantId =
    auth?.activeTenant?.id ||
    auth?.activeTenantId ||
    auth?.tenant?.id;

  const {
    method = "GET",
    body,
    headers = {},
    ...rest
  } = options;

  // CRITICAL: Do NOT set Content-Type if body is FormData
  const finalHeaders = { ...headers };
  if (!(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  } else {
    delete finalHeaders["Content-Type"];
  }

  const config = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...finalHeaders,
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(tenantId
        ? {
            "X-Tenant-Id": tenantId,
          }
        : {}),
    },
    ...rest,
  };

  // Remove Content-Type header if body is FormData
  if (body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  if (body !== undefined && method !== "GET") {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  let res = await fetch(`${BASE_URL}${endpoint}`, config);

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  /**
   * Access Token Expired
   * Try Refresh Once (single-flight, no infinite loop)
   * Auth endpoints are excluded — a 401 there means the login/refresh
   * itself failed, not that the access token expired.
   */
  if (res.status === 401 && !retrying && !isAuthEndpoint(endpoint)) {
    try {
      // Single-flight: all concurrent 401s share one refresh call
      const newToken = await getRefreshedToken();

      const retryAuth = getAuth();

      const retryTenant =
        retryAuth?.activeTenant?.id ||
        retryAuth?.activeTenantId ||
        retryAuth?.tenant?.id;

      const retryConfig = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
          ...(retryTenant
            ? {
                "X-Tenant-Id": retryTenant,
              }
            : {}),
        },
      };

      res = await fetch(`${BASE_URL}${endpoint}`, retryConfig);

      let retryData = null;

      try {
        retryData = await res.json();
      } catch {
        retryData = null;
      }
      if (!res.ok) {
        const rawMessage = retryData?.message || retryData?.error;
        const message = Array.isArray(rawMessage)
          ? rawMessage.join(", ")
          : (rawMessage || "Request failed");

        const error = new Error(message);

        error.status = res.status;
        error.data = retryData;

        throw error;
      }

      return retryData;
    } catch (refreshError) {
      // Refresh failed (invalid/expired/revoked refresh token) → force logout
      clearAuthState();
      throw refreshError;
    }
  }

  if (!res.ok) {
    const rawMessage = data?.message || data?.error;
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ")
      : (rawMessage || "Request failed");

    const error = new Error(message);

    error.status = res.status;
    error.data = data;

    throw error;
  }

  return data;
}

export { AUTH_UPDATED_EVENT };