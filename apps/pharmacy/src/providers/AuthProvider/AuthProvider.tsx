'use client';

import type { ReactNode } from 'react';

import {
  AuthProviderCore,
  type AuthProviderServices,
} from '@e-pharmacy/auth/react';

import { getCurrentUser, logoutUser } from '@/lib/api/browser';

//===================================================================

const pharmacyAuthServices = {
  getCurrentUser,
  logout: logoutUser,
} satisfies AuthProviderServices;

//===================================================================

type AuthProviderProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthProviderCore {...pharmacyAuthServices} bootstrapMode="always">
      {children}
    </AuthProviderCore>
  );
}

export default AuthProvider;
export { AuthProvider };
