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
  registerUser,
} from '@/lib/api/browser';

//===================================================================

const clientAuthServices = {
  getCurrentUser,
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
    <AuthProviderCore {...clientAuthServices} bootstrapMode="always">
      {children}
    </AuthProviderCore>
  );
}

export default AuthProvider;
