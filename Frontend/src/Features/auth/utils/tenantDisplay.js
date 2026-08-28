import { ROLES } from "@/constants/roles";

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeTenantName(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

/** Build tenant object from login user payload */
export function normalizeTenantFromUser(user) {
  if (!user) return null;

  if (user.tenant && typeof user.tenant === "object") {
    return user.tenant;
  }

  const name = normalizeTenantName(user.tenantName);
  if (name) {
    return {
      id: user.tenantId ?? null,
      name,
    };
  }

  return null;
}

/** Pick tenant for the current logged-in user — never reuse a mismatched stale tenant */
export function resolveTenantForSession(user, activeTenant, accessToken) {
  const fromUser = normalizeTenantFromUser(user);
  if (fromUser) return fromUser;

  const jwt = decodeJwtPayload(accessToken);
  if (jwt?.tenantName) {
    return {
      id: jwt.tenantId ?? user?.tenantId ?? null,
      name: jwt.tenantName,
    };
  }

  const tenantObject =
    activeTenant && typeof activeTenant === "object" ? activeTenant : null;

  if (tenantObject?.name) {
    if (!user?.tenantId || tenantObject.id === user.tenantId) {
      return tenantObject;
    }
  }

  return null;
}

export function resolveStoredTenant(stored) {
  if (!stored) return null;
  return (
    normalizeTenantFromUser(stored.user) ??
    stored.activeTenant ??
    stored.tenant ??
    null
  );
}

export function resolveTenantDisplayName({ user, activeTenant, accessToken } = {}) {
  const role = user?.role;
  const isSuperAdmin =
    role === ROLES.SUPER_ADMIN || role === 3 || role === "SUPERADMIN";

  // Always prefer fields from the logged-in user first
  const fromUser =
    normalizeTenantName(user?.tenantName) ||
    normalizeTenantName(user?.tenant?.name);

  if (fromUser) return fromUser;

  // JWT is tied to the current session token
  const jwtTenantName = normalizeTenantName(
    decodeJwtPayload(accessToken)?.tenantName
  );
  if (jwtTenantName) return jwtTenantName;

  // Only trust activeTenant when it belongs to this user
  const tenantObject =
    activeTenant && typeof activeTenant === "object" ? activeTenant : null;

  if (tenantObject?.name) {
    const matchesUser =
      !user?.tenantId || tenantObject.id === user.tenantId;

    if (matchesUser) {
      const fromActiveTenant = normalizeTenantName(tenantObject.name);
      if (fromActiveTenant) return fromActiveTenant;
    }
  }

  const stored = readStoredAuth();
  if (stored?.accessToken) {
    const storedUser = stored.user;
    const storedTenant = resolveStoredTenant(stored);

    const fromStoredUser =
      normalizeTenantName(storedUser?.tenantName) ||
      normalizeTenantName(storedUser?.tenant?.name);

    if (fromStoredUser) return fromStoredUser;

    const fromStoredJwt = normalizeTenantName(
      decodeJwtPayload(stored.accessToken)?.tenantName
    );
    if (fromStoredJwt) return fromStoredJwt;

    if (storedTenant?.name) {
      const matchesStoredUser =
        !storedUser?.tenantId || storedTenant.id === storedUser.tenantId;

      if (matchesStoredUser) {
        const fromStoredTenant = normalizeTenantName(storedTenant.name);
        if (fromStoredTenant) return fromStoredTenant;
      }
    }
  }

  if (isSuperAdmin) return "System Portal";

  return null;
}

export function enrichUserWithTenant(user, activeTenant, accessToken) {
  if (!user) return null;

  const tenantObject = resolveTenantForSession(user, activeTenant, accessToken);

  const tenantName =
    resolveTenantDisplayName({ user, activeTenant: tenantObject, accessToken }) ||
    normalizeTenantName(user.tenantName);

  return {
    ...user,
    tenantName: tenantName || user.tenantName || null,
    tenant: tenantObject || user.tenant || null,
  };
}

export function readStoredAuth() {
  if (typeof window === "undefined") return null;
  return safeParse(localStorage.getItem("auth"));
}

export function getAuthSession() {
  const stored = readStoredAuth();
  if (!stored?.accessToken) return null;

  const activeTenant = resolveStoredTenant(stored);
  const user = enrichUserWithTenant(
    stored.user,
    activeTenant,
    stored.accessToken
  );

  if (!user) return null;

  return {
    user,
    accessToken: stored.accessToken,
    activeTenant: activeTenant ?? normalizeTenantFromUser(user),
    isAuthenticated: true,
    tenantDisplayName: resolveTenantDisplayName({
      user,
      activeTenant: activeTenant ?? user.tenant,
      accessToken: stored.accessToken,
    }),
  };
}

export function hasActiveTenantSession({ user, activeTenant, isSuperAdmin }) {
  if (isSuperAdmin) return true;

  const tenantRecord = resolveTenantForSession(
    user,
    activeTenant,
    null
  );

  return Boolean(
    tenantRecord?.id ||
      user?.tenantId ||
      user?.tenant?.id ||
      user?.tenantName
  );
}

export function deriveTenantFromLoginPayload(data) {
  if (!data) return null;

  return (
    data.activeTenant ||
    data.tenant ||
    normalizeTenantFromUser(data.user)
  );
}
