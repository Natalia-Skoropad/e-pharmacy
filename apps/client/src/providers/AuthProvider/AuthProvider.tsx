'use client';

import type { ReactNode } from 'react';

import {
  AuthProviderCore,
  type AuthProviderServices,
} from '@e-pharmacy/auth/core';

import { serverManagedBrowserAuthSessionHintStorage } from '@e-pharmacy/auth/session';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from '@/lib/api/browser';

//===================================================================

const clientAuthServices = {
  getCurrentUser,
  refreshSession,
  login: loginUser,
  register: registerUser,
  logout: logoutUser,
} satisfies AuthProviderServices;

//===================================================================

type AuthProviderProps = {
  children: ReactNode;
};

//===================================================================

function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthProviderCore
      {...clientAuthServices}
      sessionHintStorage={serverManagedBrowserAuthSessionHintStorage}
    >
      {children}
    </AuthProviderCore>
  );
}

export default AuthProvider;
