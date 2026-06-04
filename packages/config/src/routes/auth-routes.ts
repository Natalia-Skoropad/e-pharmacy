import { ROUTES } from './client-routes';

//===================================================================

const DEFAULT_AUTH_REDIRECT_PATH = ROUTES.PROFILE;

//===================================================================

export function getSafeRedirectPath(
  redirectPath: string | null,
  fallbackPath = DEFAULT_AUTH_REDIRECT_PATH
): string {
  if (
    !redirectPath ||
    !redirectPath.startsWith('/') ||
    redirectPath.startsWith('//')
  ) {
    return fallbackPath;
  }

  return redirectPath;
}

//===================================================================

export function buildLoginRedirectPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${ROUTES.LOGIN}?redirect=${encodeURIComponent(normalizedPath)}`;
}
