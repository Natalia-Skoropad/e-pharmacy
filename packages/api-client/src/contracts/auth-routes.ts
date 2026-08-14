import type { EntityId } from '@e-pharmacy/types/primitives';

import { encodeRouteSegment } from './route-segment';

//===================================================================

export const authRoutes = {
  register: '/auth/register',
  pharmacyDocumentUploadSession: '/auth/pharmacy-documents/session',
  pharmacyDocumentUpload: '/auth/pharmacy-documents',
  login: '/auth/login',
  logout: '/auth/logout',
  logoutAll: '/auth/logout-all',
  refresh: '/auth/refresh',
  current: '/auth/current',
  password: '/auth/current/password',
  sessions: '/auth/sessions',

  session: (sessionId: EntityId) =>
    `/auth/sessions/${encodeRouteSegment(sessionId)}`,

  passwordResetRequest: '/auth/password-reset/request',
  passwordResetConfirm: '/auth/password-reset/confirm',
} as const;
