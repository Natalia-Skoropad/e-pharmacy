import { encodeRouteSegment } from '@e-pharmacy/api-client/contracts';
import type { EntityId } from '@e-pharmacy/types/primitives';

//===================================================================

/**
 * Shared same-origin Next.js BFF routes for authentication.
 *
 * Backend `/auth/*` contracts belong to `@e-pharmacy/api-client/contracts`.
 * Application-specific `/api/*` routes remain owned by each application.
 */
export const localAuthApiRoutes = {
  register: '/api/auth/register',
  pharmacyDocumentUploadSession: '/api/auth/pharmacy-documents/session',
  pharmacyDocumentUpload: '/api/auth/pharmacy-documents',
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
