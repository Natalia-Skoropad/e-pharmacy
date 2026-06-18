const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;

//===================================================================

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
    CONTROL_CHARACTER_PATTERN.test(redirectPath) ||
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

//===================================================================

export type SafeApplicationRedirectOptions = {
  allowedPrefixes: readonly string[];
  fallbackPath?: string;
};

//===================================================================

export function getSafeApplicationRedirectPath(
  redirectPath: string | null,
  { allowedPrefixes, fallbackPath = '/' }: SafeApplicationRedirectOptions
): string {
  const safePath = getSafeRedirectPath(redirectPath, fallbackPath);
  const pathname = safePath.split(/[?#]/, 1)[0] || '/';
  const isAllowed = allowedPrefixes.some((prefix) => {
    const normalizedPrefix = prefix === '/' ? '/' : prefix.replace(/\/$/, '');
    return normalizedPrefix === '/'
      ? pathname === '/'
      : pathname === normalizedPrefix ||
          pathname.startsWith(`${normalizedPrefix}/`);
  });
  return isAllowed ? safePath : fallbackPath;
}
