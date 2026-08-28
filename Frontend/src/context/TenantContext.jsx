import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  normalizeTenantFromUser,
  readStoredAuth,
  resolveTenantForSession,
} from '@/Features/auth/utils/tenantDisplay';

export const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [activeTenant, setActiveTenantState] = useState(() => {
    const stored = readStoredAuth();
    if (!stored) return null;

    return resolveTenantForSession(
      stored.user,
      stored.activeTenant ?? stored.tenant,
      stored.accessToken
    );
  });

  useEffect(() => {
    const onStorage = () => {
      const stored = readStoredAuth();
      if (!stored) {
        setActiveTenantState(null);
        return;
      }

      setActiveTenantState(
        resolveTenantForSession(
          stored.user,
          stored.activeTenant ?? stored.tenant,
          stored.accessToken
        )
      );
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({
      activeTenant,
      setActiveTenant: (tenant) => {
        setActiveTenantState(tenant);

        const stored = readStoredAuth() || {};
        const resolvedTenant =
          tenant ??
          normalizeTenantFromUser(stored.user) ??
          resolveTenantForSession(
            stored.user,
            stored.activeTenant,
            stored.accessToken
          );

        localStorage.setItem(
          'auth',
          JSON.stringify({ ...stored, activeTenant: resolvedTenant })
        );
      },
      clearTenant: () => {
        setActiveTenantState(null);
        const stored = readStoredAuth() || {};
        delete stored.activeTenant;
        localStorage.setItem('auth', JSON.stringify(stored));
      },
    }),
    [activeTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
};