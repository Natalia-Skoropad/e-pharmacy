export function getSafeRedirectPath(
  redirectPath: string | null,
  fallbackPath = '/'
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

export function buildLoginRedirectPath(
  path: string,
  loginPath = '/login'
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${loginPath}?redirect=${encodeURIComponent(normalizedPath)}`;
}
