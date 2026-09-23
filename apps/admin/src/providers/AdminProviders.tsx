'use client';

import type { ReactNode } from 'react';

import { ToastProvider } from '@e-pharmacy/ui/feedback';

//===================================================================

type AdminProvidersProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export function AdminProviders({ children }: AdminProvidersProps) {
  return <ToastProvider>{children}</ToastProvider>;
}
