'use client';

import {
  AuthProviderCore,
  type AuthProviderServices,
} from '@e-pharmacy/auth/core';

import { browserAuthSessionHintStorage } from '@e-pharmacy/auth/session';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from '@e-pharmacy/api-client/client';

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
    <AuthProviderCore
      {...clientAuthServices}
      sessionHintStorage={browserAuthSessionHintStorage}
    >
      {children}
    </AuthProviderCore>
  );
}

export default AuthProvider;
