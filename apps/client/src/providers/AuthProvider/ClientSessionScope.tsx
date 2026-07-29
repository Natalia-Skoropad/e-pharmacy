'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { useAuth } from '@e-pharmacy/auth/react';

import {
  createClientAuthIdentity,
  createClientSessionOwnerKey,
} from './client-session-lifecycle';

//===================================================================

export type ClientSessionScope = Readonly<{
  ownerKey: string;
  generation: number;
}>;

const ClientSessionScopeContext = createContext<ClientSessionScope | null>(
  null
);

//===================================================================

type ClientSessionScopeBoundaryProps = Readonly<{
  authIdentity: string;
  children: ReactNode;
}>;

function ClientSessionScopeBoundary({
  authIdentity,
  children,
}: ClientSessionScopeBoundaryProps) {
  const value = useMemo<ClientSessionScope>(() => {
    const lifecycle = { authIdentity, generation: 0 } as const;

    return {
      ownerKey: createClientSessionOwnerKey(lifecycle),
      generation: lifecycle.generation,
    };
  }, [authIdentity]);

  return (
    <ClientSessionScopeContext.Provider value={value}>
      {children}
    </ClientSessionScopeContext.Provider>
  );
}

//===================================================================

export function ClientSessionScopeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { status, user } = useAuth();
  const authIdentity = createClientAuthIdentity(status, user);

  return (
    <ClientSessionScopeBoundary
      key={authIdentity}
      authIdentity={authIdentity}
    >
      {children}
    </ClientSessionScopeBoundary>
  );
}

//===================================================================

export function useClientSessionScope(): ClientSessionScope {
  const context = useContext(ClientSessionScopeContext);

  if (!context) {
    throw new Error(
      'useClientSessionScope must be used inside ClientSessionScopeProvider.'
    );
  }

  return context;
}
