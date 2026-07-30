import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const TenantContext = createContext(null);

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const TenantProvider = ({ children }) => {
  const [activeTenant, setActiveTenant] = useState(() => {
    const stored = safeParse(localStorage.getItem('auth'));
    return stored?.activeTenant ?? stored?.tenant ?? null;
  });

  useEffect(() => {
    const onStorage = () => {
      const stored = safeParse(localStorage.getItem('auth'));
      setActiveTenant(stored?.activeTenant ?? stored?.tenant ?? null);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({
      activeTenant,
      setActiveTenant: (tenant) => {
        setActiveTenant(tenant);
        const stored = safeParse(localStorage.getItem('auth')) || {};
        localStorage.setItem(
          'auth',
          JSON.stringify({ ...stored, activeTenant: tenant })
        );
      },
      clearTenant: () => {
        setActiveTenant(null);
        const stored = safeParse(localStorage.getItem('auth')) || {};
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