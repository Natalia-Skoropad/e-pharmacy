'use client';

import type { ReactNode } from 'react';

import {
  AuthProviderCore,
  type AuthProviderServices,
} from '@e-pharmacy/auth/react';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
} from '@/lib/api/browser/auth.api';

//===================================================================

const adminAuthServices = {
  getCurrentUser,
  login: loginUser,
  logout: logoutUser,
} satisfies AuthProviderServices;

//===================================================================

type AuthProviderProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthProviderCore {...adminAuthServices} bootstrapMode="always">
      {children}
    </AuthProviderCore>
  );
}

export default AuthProvider;
export { AuthProvider };
