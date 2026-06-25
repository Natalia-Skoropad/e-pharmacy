'use client';

import type { ReactNode } from 'react';

import {
  AuthProviderCore,
  type AuthProviderServices,
} from '@e-pharmacy/auth/core';

import { createBrowserAuthSessionHintStorage } from '@e-pharmacy/auth/session';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from '@/lib/api/browser';

//===================================================================

const clientAuthSessionHintStorage = createBrowserAuthSessionHintStorage({
  domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || undefined,
  sameSite:
    process.env.NEXT_PUBLIC_AUTH_COOKIE_SAME_SITE === 'none' ? 'None' : 'Lax',
});

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
      sessionHintStorage={clientAuthSessionHintStorage}
    >
      {children}
    </AuthProviderCore>
  );
}

export default AuthProvider;
