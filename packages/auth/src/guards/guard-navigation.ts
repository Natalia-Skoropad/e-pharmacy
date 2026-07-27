import { getSafeLocalRedirectPath } from '../routing/redirects';

//===================================================================

export type TrustedExternalRedirectResolver = (
  candidate: string
) => string | null;

export type GuardNavigationDestination = Readonly<
  | { type: 'local'; href: string }
  | { type: 'external'; href: string }
>;

//===================================================================

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveGuardNavigationDestination({
  candidate,
  localFallback = '/',
  resolveExternalRedirect,
}: {
  candidate: string;
  localFallback?: string;
  resolveExternalRedirect?: TrustedExternalRedirectResolver;
}): GuardNavigationDestination {
  if (isAbsoluteHttpUrl(candidate)) {
    const trustedExternalUrl = resolveExternalRedirect?.(candidate) ?? null;

    if (trustedExternalUrl) {
      return { type: 'external', href: trustedExternalUrl };
    }

    return {
      type: 'local',
      href: getSafeLocalRedirectPath(localFallback, '/'),
    };
  }

  return {
    type: 'local',
    href: getSafeLocalRedirectPath(candidate, localFallback),
  };
}

//===================================================================

export function buildCurrentLocation({
  pathname,
  queryString,
  hash,
}: {
  pathname: string;
  queryString: string;
  hash: string;
}): string {
  return `${pathname}${queryString ? `?${queryString}` : ''}${hash}`;
}
