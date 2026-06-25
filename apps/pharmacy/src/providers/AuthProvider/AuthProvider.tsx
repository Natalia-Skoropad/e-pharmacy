'use client';

import type { ReactNode } from 'react';

import {
  AuthProviderCore,
  type AuthProviderServices,
} from '@e-pharmacy/auth/core';

import { createBrowserAuthSessionHintStorage } from '@e-pharmacy/auth/session';

import {
  getCurrentUser,
  logoutUser,
  refreshSession,
} from '@/lib/api/browser';

//===================================================================

const pharmacyAuthSessionHintStorage = createBrowserAuthSessionHintStorage({
  domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || undefined,
  sameSite:
    process.env.NEXT_PUBLIC_AUTH_COOKIE_SAME_SITE === 'none' ? 'None' : 'Lax',
});

//===================================================================

const pharmacyAuthServices = {
  getCurrentUser,
  refreshSession,

  async login() {
    throw new Error('Use the shared E-PHARMACY login page to sign in.');
  },

  async logout() {
    await logoutUser();
  },
} satisfies AuthProviderServices;

//===================================================================

type AuthProviderProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthProviderCore
      {...pharmacyAuthServices}
      sessionHintStorage={pharmacyAuthSessionHintStorage}
    >
      {children}
    </AuthProviderCore>
  );
}

export default AuthProvider;
export { AuthProvider };
