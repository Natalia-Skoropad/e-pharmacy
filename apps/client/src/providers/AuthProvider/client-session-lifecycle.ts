import type { AuthStatus } from '@e-pharmacy/auth/react';
import type { AuthUser } from '@e-pharmacy/types/auth';

//===================================================================

export type ClientSessionLifecycle = Readonly<{
  authIdentity: string;
  generation: number;
}>;

let nextSessionGeneration = 0;

//===================================================================

export function createClientAuthIdentity(
  status: AuthStatus,
  user: AuthUser | null
): string {
  return `${status}:${user?.id ?? 'anonymous'}:${user?.role ?? 'none'}:${user?.status ?? 'none'}`;
}

//===================================================================

export function createClientSessionLifecycle(
  authIdentity: string
): ClientSessionLifecycle {
  nextSessionGeneration += 1;

  return {
    authIdentity,
    generation: nextSessionGeneration,
  };
}

//===================================================================

export function createClientSessionOwnerKey(
  lifecycle: ClientSessionLifecycle
): string {
  return `${lifecycle.generation}:${lifecycle.authIdentity}`;
}
