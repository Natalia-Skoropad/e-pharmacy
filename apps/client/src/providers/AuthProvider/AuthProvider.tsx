'use client';

import type { ReactNode } from 'react';

import {
  AuthProviderCore,
  type AuthProviderServices,
} from '@e-pharmacy/auth/react';

import {
  getCurrentUser,
  loginUser,
  logoutAllUser,
  logoutUser,
  registerUser,
} from '@/lib/api/browser';

import { ClientSessionScopeProvider } from './ClientSessionScope';

//===================================================================

const clientAuthServices = {
  getCurrentUser,
  login: loginUser,
  register: registerUser,
  logout: logoutUser,
  logoutAll: logoutAllUser,
} satisfies AuthProviderServices;

//===================================================================

type AuthProviderProps = {
  children: ReactNode;
};

//===================================================================

function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthProviderCore {...clientAuthServices} bootstrapMode="always">
      <ClientSessionScopeProvider>{children}</ClientSessionScopeProvider>
    </AuthProviderCore>
  );
}

export default AuthProvider;
