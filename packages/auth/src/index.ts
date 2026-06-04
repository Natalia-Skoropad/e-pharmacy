export type { AuthAccessConfig, AuthAppKind, AuthRedirects } from './config';

export type {
  AuthContextValue,
  AuthProviderCoreProps,
  AuthProviderServices,
  AuthStatus,
} from './core';

export { AuthProviderCore, useAuth } from './core';

export type {
  GuestOnlyRouteProps,
  ProtectedRouteProps,
  RoleProtectedRouteProps,
} from './guards';

export { GuestOnlyRoute, ProtectedRoute, RoleProtectedRoute } from './guards';
export { getAuthErrorMessage } from './errors';

export {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_READY_COOKIE_NAME,
  AUTH_SESSION_MARKER,
  LEGACY_AUTH_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  getAuthSessionMarker,
  removeAuthSessionMarker,
  setAuthSessionMarker,
} from './session';

export {
  buildLoginRedirectPath,
  createAuthLoginRedirectPath,
  getSafeRedirectPath,
  normalizeAuthRedirectPath,
} from './routing';
