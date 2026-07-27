'use client';

import { useAuth } from '@e-pharmacy/auth/react';

import {
  selectPublicAuthActionsState,
  type PublicAuthActionsState,
} from './public-auth-actions-state';

//===================================================================

export function usePublicAuthActionsState(): PublicAuthActionsState {
  return selectPublicAuthActionsState(useAuth());
}
