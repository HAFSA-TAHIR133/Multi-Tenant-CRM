import React from 'react';
import { TenantProvider } from './TenantContext';
import { AuthProvider } from '@/Features/auth/context/AuthContext'; 

console.log(AuthProvider);

const composeProviders = (...providers) => {
  return ({ children }) => {
    return providers.reduceRight((acc, Provider) => {
      return <Provider>{acc}</Provider>;
    }, children);
  };
};

const Providers = composeProviders(
  TenantProvider,
  AuthProvider
);

export default Providers;