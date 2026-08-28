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

export function resolveStoredTenant(stored) {
  if (!stored) return null;
  return stored.activeTenant ?? stored.tenant ?? stored.user?.tenant ?? null;
}

export function resolveTenantDisplayName({ user, activeTenant, accessToken } = {}) {
  const role = user?.role;
  const isSuperAdmin =
    role === ROLES.SUPER_ADMIN || role === 3 || role === "SUPERADMIN";

  const fromUser =
    normalizeTenantName(user?.tenantName) ||
    normalizeTenantName(user?.tenant?.name);

  if (fromUser) return fromUser;

  const tenantObject =
    activeTenant && typeof activeTenant === "object" ? activeTenant : null;

  const fromActiveTenant = normalizeTenantName(tenantObject?.name);
  if (fromActiveTenant) return fromActiveTenant;

  const jwtTenantName = normalizeTenantName(
    decodeJwtPayload(accessToken)?.tenantName
  );
  if (jwtTenantName) return jwtTenantName;

  const stored = readStoredAuth();
  if (stored?.accessToken) {
    const storedTenant = resolveStoredTenant(stored);
    const storedUser = stored.user;

    const fromStoredUser =
      normalizeTenantName(storedUser?.tenantName) ||
      normalizeTenantName(storedUser?.tenant?.name) ||
      normalizeTenantName(storedTenant?.name);

    if (fromStoredUser) return fromStoredUser;

    const fromStoredJwt = normalizeTenantName(
      decodeJwtPayload(stored.accessToken)?.tenantName
    );
    if (fromStoredJwt) return fromStoredJwt;
  }

  if (isSuperAdmin) return "System Portal";

  return null;
}

export function enrichUserWithTenant(user, activeTenant, accessToken) {
  if (!user) return null;

  const tenantObject =
    user.tenant ||
    (activeTenant && typeof activeTenant === "object" ? activeTenant : null);

  const tenantName =
    resolveTenantDisplayName({ user, activeTenant, accessToken }) ||
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
  const user = enrichUserWithTenant(stored.user, activeTenant, stored.accessToken);

  if (!user) return null;

  return {
    user,
    accessToken: stored.accessToken,
    activeTenant,
    isAuthenticated: true,
    tenantDisplayName: resolveTenantDisplayName({
      user,
      activeTenant,
      accessToken: stored.accessToken,
    }),
  };
}

export function hasActiveTenantSession({ user, activeTenant, isSuperAdmin }) {
  if (isSuperAdmin) return true;

  const tenantRecord =
    activeTenant && typeof activeTenant === "object" ? activeTenant : null;

  return Boolean(
    tenantRecord?.id ||
      tenantRecord?._id ||
      (typeof activeTenant === "string" || typeof activeTenant === "number"
        ? activeTenant
        : null) ||
      user?.tenantId ||
      user?.tenant?.id ||
      user?.tenantName
  );
}
