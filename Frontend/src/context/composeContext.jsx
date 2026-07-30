// src/context/composeContext.jsx
import { TenantProvider } from './TenantContext';
import { AuthProvider } from '@/Features/auth/context/AuthContext';

export default function Providers({ children }) {
  return (
    <TenantProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </TenantProvider>
  );
}