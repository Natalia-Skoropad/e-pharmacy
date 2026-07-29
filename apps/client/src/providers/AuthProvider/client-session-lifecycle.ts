import type { AuthStatus } from '@e-pharmacy/auth/react';
import type { AuthUser } from '@e-pharmacy/types/auth';

//===================================================================

export type ClientSessionLifecycle = Readonly<{
  authIdentity: string;
  generation: number;
}>;

//===================================================================

export function createClientAuthIdentity(
  status: AuthStatus,
  user: AuthUser | null
): string {
  return `${status}:${user?.id ?? 'anonymous'}:${user?.role ?? 'none'}:${user?.status ?? 'none'}`;
}

//===================================================================

export function advanceClientSessionLifecycle(
  current: ClientSessionLifecycle,
  authIdentity: string
): ClientSessionLifecycle {
  if (current.authIdentity === authIdentity) return current;

  return {
    authIdentity,
    generation: current.generation + 1,
  };
}

//===================================================================

export function createClientSessionOwnerKey(
  lifecycle: ClientSessionLifecycle
): string {
  return `${lifecycle.generation}:${lifecycle.authIdentity}`;
}
