'use client';

import { useAuth } from '@e-pharmacy/auth/react';

import {
  selectClientAuthCapabilities,
  type ClientAuthCapabilities,
} from './client-auth-capabilities';

//===================================================================

export function useClientAuthCapabilities(): ClientAuthCapabilities {
  return selectClientAuthCapabilities(useAuth());
}
