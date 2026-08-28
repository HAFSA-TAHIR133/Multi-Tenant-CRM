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
