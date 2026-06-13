function containsEncodedSlashOrBackslash(value: string): boolean {
  let currentValue = value;

  for (let index = 0; index < 3; index += 1) {
    try {
      const decodedValue = decodeURIComponent(currentValue);
      if (decodedValue === currentValue) break;

      currentValue = decodedValue;
    } catch {
      return true;
    }

    if (currentValue.includes('\\') || currentValue.startsWith('//')) {
      return true;
    }
  }

  return currentValue.includes('\\') || currentValue.startsWith('//');
}

//===================================================================

export function getSafeRedirectPath(
  redirectPath: string | null,
  fallbackPath = '/'
): string {
  if (
    !redirectPath ||
    !redirectPath.startsWith('/') ||
    redirectPath.startsWith('//') ||
    redirectPath.includes('\\') ||
    containsEncodedSlashOrBackslash(redirectPath)
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
  const safePath = getSafeRedirectPath(normalizedPath, '/');

  return `${loginPath}?redirect=${encodeURIComponent(safePath)}`;
}
