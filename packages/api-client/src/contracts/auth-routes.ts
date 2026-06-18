import type { EntityId } from '@e-pharmacy/types';

//===================================================================

export const authRoutes = {
  register: '/auth/register',
  login: '/auth/login',
  logout: '/auth/logout',
  logoutAll: '/auth/logout-all',
  refresh: '/auth/refresh',
  current: '/auth/current',
  password: '/auth/current/password',
  sessions: '/auth/sessions',
  session: (sessionId: EntityId) => `/auth/sessions/${sessionId}`,
  passwordResetRequest: '/auth/password-reset/request',
  passwordResetConfirm: '/auth/password-reset/confirm',
} as const;
