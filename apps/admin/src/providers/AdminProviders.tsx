'use client';

import type { ReactNode } from 'react';

import { ToastProvider } from '@e-pharmacy/ui/feedback';

import { AuthProvider } from './AuthProvider';

//===================================================================

type AdminProvidersProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export function AdminProviders({ children }: AdminProvidersProps) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
