const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

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

/**
 * Refresh Access Token
 * Refresh token is stored inside an HttpOnly Cookie.
 * Browser automatically sends it because of credentials: "include".
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

  return newAccessToken;
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

  const config = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
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

  if (body !== undefined && method !== "GET") {
    config.body = JSON.stringify(body);
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
   * Try Refresh Once
   */
  if (res.status === 401 && !retrying) {
    try {
      const newToken = await refreshAccessToken();

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
        const error = new Error(
          retryData?.message ||
            retryData?.error ||
            "Request failed"
        );

        error.status = res.status;
        error.data = retryData;

        throw error;
      }

      return retryData;
    } catch (refreshError) {
      localStorage.removeItem("auth");

      throw refreshError;
    }
  }

  if (!res.ok) {
    const error = new Error(
      data?.message ||
        data?.error ||
        "Request failed"
    );

    error.status = res.status;
    error.data = data;

    throw error;
  }

  return data;
}