'use client';

import type { ReactNode } from 'react';

import type { LoginPayload } from '@e-pharmacy/types';

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
} from '@/lib/api/browser';

import {
  clearDemoPharmacyUser,
  getDemoCurrentPharmacyUser,
  loginDemoPharmacyUser,
} from '@/lib/auth/demo-pharmacy-auth';

//===================================================================

const pharmacyAuthSessionHintStorage = createBrowserAuthSessionHintStorage({
  domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || undefined,
  sameSite:
    process.env.NEXT_PUBLIC_AUTH_COOKIE_SAME_SITE === 'none' ? 'None' : 'Lax',
});

//===================================================================

const pharmacyAuthServices = {
  async getCurrentUser() {
    const demoUser = await getDemoCurrentPharmacyUser();
    if (demoUser) return demoUser;

    return getCurrentUser();
  },

  async refreshSession() {
    const demoUser = await getDemoCurrentPharmacyUser();
    if (demoUser) return demoUser;

    return refreshSession();
  },

  async login(payload: LoginPayload) {
    const demoResponse = await loginDemoPharmacyUser(payload);
    if (demoResponse) return demoResponse;

    return loginUser(payload);
  },

  async logout() {
    clearDemoPharmacyUser();

    try {
      await logoutUser();
    } catch {
      // Demo mode can be used without a running backend, so logout stays local-safe.
    }
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
