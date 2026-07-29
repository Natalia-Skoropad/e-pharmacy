'use client';

import type { ReactNode } from 'react';

import { ToastProvider } from '@e-pharmacy/ui/feedback';

import AuthProvider from './AuthProvider';
import { CartProvider } from './CartProvider';
import { ClientProviderStack } from './client-provider-stack';
import { FavoritesProvider } from './FavoritesProvider';

//===================================================================

export type ClientProvidersProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ClientProviderStack
      ToastProvider={ToastProvider}
      AuthProvider={AuthProvider}
      FavoritesProvider={FavoritesProvider}
      CartProvider={CartProvider}
    >
      {children}
    </ClientProviderStack>
  );
}
