const LOCAL_REDIRECT_BASE_URL = 'https://local.e-pharmacy.invalid';
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;
const INVALID_PERCENT_ENCODING_PATTERN = /%(?![0-9A-Fa-f]{2})/;
const ENCODED_SLASH_OR_BACKSLASH_PATTERN = /%(?:2f|5c)/i;
const ENCODED_CONTROL_CHARACTER_PATTERN = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i;
const MAX_DECODE_PASSES = 4;

//===================================================================

function getPathnameCandidate(value: string): string {
  return value.split(/[?#]/, 1)[0] || '/';
}

//===================================================================

function hasDotSegments(value: string): boolean {
  return getPathnameCandidate(value)
    .split('/')
    .some((segment) => segment === '.' || segment === '..');
}

//===================================================================

function hasRepeatedPathSeparators(value: string): boolean {
  return getPathnameCandidate(value).slice(1).includes('//');
}

//===================================================================

function containsEncodedControlCharacter(value: string): boolean {
  let decodedValue = value;

  for (let index = 0; index < MAX_DECODE_PASSES; index += 1) {
    if (
      INVALID_PERCENT_ENCODING_PATTERN.test(decodedValue) ||
      ENCODED_CONTROL_CHARACTER_PATTERN.test(decodedValue)
    ) {
      return true;
    }

    try {
      const nextValue = decodeURIComponent(decodedValue);
      if (nextValue === decodedValue) break;
      decodedValue = nextValue;
    } catch {
      return true;
    }

    if (CONTROL_CHARACTER_PATTERN.test(decodedValue)) return true;
  }

  return false;
}

//===================================================================

function isUnsafeLocalCandidate(value: string): boolean {
  const pathnameCandidate = getPathnameCandidate(value);

  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    INVALID_PERCENT_ENCODING_PATTERN.test(value) ||
    containsEncodedControlCharacter(value) ||
    ENCODED_SLASH_OR_BACKSLASH_PATTERN.test(pathnameCandidate) ||
    hasDotSegments(pathnameCandidate) ||
    hasRepeatedPathSeparators(pathnameCandidate)
  ) {
    return true;
  }

  let decodedPathname = pathnameCandidate;

  for (let index = 0; index < MAX_DECODE_PASSES; index += 1) {
    if (
      INVALID_PERCENT_ENCODING_PATTERN.test(decodedPathname) ||
      ENCODED_SLASH_OR_BACKSLASH_PATTERN.test(decodedPathname) ||
      ENCODED_CONTROL_CHARACTER_PATTERN.test(decodedPathname)
    ) {
      return true;
    }

    try {
      const nextValue = decodeURIComponent(decodedPathname);
      if (nextValue === decodedPathname) break;
      decodedPathname = nextValue;
    } catch {
      return true;
    }

    if (
      decodedPathname.startsWith('//') ||
      decodedPathname.includes('\\') ||
      CONTROL_CHARACTER_PATTERN.test(decodedPathname) ||
      hasDotSegments(decodedPathname) ||
      hasRepeatedPathSeparators(decodedPathname)
    ) {
      return true;
    }
  }

  return false;
}

//===================================================================

function parseSafeLocalRedirectPath(value: string | null): string | null {
  if (!value || value !== value.trim() || isUnsafeLocalCandidate(value)) {
    return null;
  }

  try {
    const baseUrl = new URL(LOCAL_REDIRECT_BASE_URL);
    const parsedUrl = new URL(value, baseUrl);

    if (parsedUrl.origin !== baseUrl.origin) return null;

    const normalizedPath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

    if (isUnsafeLocalCandidate(normalizedPath)) return null;
    return normalizedPath;
  } catch {
    return null;
  }
}

//===================================================================

export function getSafeLocalRedirectPath(
  redirectPath: string | null,
  fallbackPath = '/'
): string {
  return (
    parseSafeLocalRedirectPath(redirectPath) ??
    parseSafeLocalRedirectPath(fallbackPath) ??
    '/'
  );
}

//===================================================================

export function buildLoginRedirectPath(
  path: string,
  loginPath = '/login'
): string {
  const safeLoginPath = getSafeLocalRedirectPath(loginPath, '/login');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const safePath = getSafeLocalRedirectPath(normalizedPath, '/');

  const loginUrl = new URL(safeLoginPath, LOCAL_REDIRECT_BASE_URL);
  loginUrl.searchParams.set('redirect', safePath);

  return `${loginUrl.pathname}${loginUrl.search}${loginUrl.hash}`;
}

//===================================================================

export type SafeApplicationRedirectOptions = Readonly<{
  allowedPrefixes: readonly string[];
  fallbackPath?: string;
}>;

function normalizeAllowedPrefix(prefix: string): string | null {
  const safePrefix = parseSafeLocalRedirectPath(prefix);
  if (!safePrefix) return null;

  const pathname = getPathnameCandidate(safePrefix);
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
}

//===================================================================

function isPathAllowed(
  pathname: string,
  allowedPrefixes: readonly string[]
): boolean {
  return allowedPrefixes.some((prefix) => {
    const normalizedPrefix = normalizeAllowedPrefix(prefix);
    if (!normalizedPrefix) return false;

    return normalizedPrefix === '/'
      ? pathname === '/'
      : pathname === normalizedPrefix ||
          pathname.startsWith(`${normalizedPrefix}/`);
  });
}

//===================================================================

export function getSafeApplicationRedirectPath(
  redirectPath: string | null,
  { allowedPrefixes, fallbackPath = '/' }: SafeApplicationRedirectOptions
): string {
  const safeFallback = getSafeLocalRedirectPath(fallbackPath, '/');
  const safePath = parseSafeLocalRedirectPath(redirectPath);

  if (!safePath) return safeFallback;

  const pathname = getPathnameCandidate(safePath);
  return isPathAllowed(pathname, allowedPrefixes) ? safePath : safeFallback;
}

//===================================================================

export type TrustedExternalRedirectOptions = Readonly<{
  allowedOrigins: readonly string[];
  allowedPathPrefixes?: readonly string[];
}>;

//===================================================================

function normalizeAllowedOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

//===================================================================

function getRawAbsolutePathCandidate(value: string): string | null {
  const match = value.match(/^[a-zA-Z][a-zA-Z\d+.-]*:\/\/[^/?#]*(\/[^?#]*)?/);
  return match ? (match[1] ?? '/') : null;
}

//===================================================================

export function getTrustedExternalRedirectUrl(
  redirectUrl: string | null,
  { allowedOrigins, allowedPathPrefixes }: TrustedExternalRedirectOptions
): string | null {
  if (!redirectUrl || redirectUrl !== redirectUrl.trim()) return null;
  if (CONTROL_CHARACTER_PATTERN.test(redirectUrl)) return null;

  const rawPath = getRawAbsolutePathCandidate(redirectUrl);
  if (!rawPath || isUnsafeLocalCandidate(rawPath)) return null;

  try {
    const parsedUrl = new URL(redirectUrl);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }

    if (parsedUrl.username || parsedUrl.password) return null;

    const trustedOrigins = new Set(
      allowedOrigins
        .map(normalizeAllowedOrigin)
        .filter((origin): origin is string => Boolean(origin))
    );

    if (!trustedOrigins.has(parsedUrl.origin)) return null;

    const safeLocalPath = parseSafeLocalRedirectPath(
      `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
    );

    if (!safeLocalPath) return null;

    if (
      allowedPathPrefixes &&
      !isPathAllowed(getPathnameCandidate(safeLocalPath), allowedPathPrefixes)
    ) {
      return null;
    }

    return new URL(safeLocalPath, parsedUrl.origin).toString();
  } catch {
    return null;
  }
}
