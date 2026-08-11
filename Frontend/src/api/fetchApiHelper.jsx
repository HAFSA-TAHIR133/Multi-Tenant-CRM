const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");

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

let refreshPromise = null;

const AUTH_UPDATED_EVENT = "auth:updated";

function notifyAuthUpdated() {
  window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT));
}

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

  notifyAuthUpdated();

  return newAccessToken;
}


function getRefreshedToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function clearAuthState() {
  localStorage.removeItem("auth");
  notifyAuthUpdated();
}

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
      ...finalHeaders,...(token? {Authorization: `Bearer ${token}`,}
        : {}),
      ...(tenantId
        ? {
            "X-Tenant-Id": tenantId,
          }
        : {}),
    },
    ...rest,
  };

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

  if (res.status === 401 && !retrying && !isAuthEndpoint(endpoint)) {
    try {
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