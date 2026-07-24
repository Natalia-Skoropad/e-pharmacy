import type { EntityId } from '@e-pharmacy/types/primitives';

import { encodeRouteSegment } from './route-segment';

//===================================================================

export const localAuthApiRoutes = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  logoutAll: '/api/auth/logout-all',
  refresh: '/api/auth/refresh',
  current: '/api/auth/me',
  password: '/api/auth/password',
  sessions: '/api/auth/sessions',

  session: (sessionId: EntityId) =>
    `/api/auth/sessions/${encodeRouteSegment(sessionId)}`,

  passwordResetRequest: '/api/auth/password-reset/request',
  passwordResetConfirm: '/api/auth/password-reset/confirm',
} as const;
