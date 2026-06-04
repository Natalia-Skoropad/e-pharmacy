'use client';

import { AuthProviderCore, useAuth, type AuthProviderServices } from '@e-pharmacy/auth';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from '@/services';

import type { ReactNode } from 'react';

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
    <AuthProviderCore services={clientAuthServices}>
      {children}
    </AuthProviderCore>
  );
}

export { useAuth };
export default AuthProvider;
