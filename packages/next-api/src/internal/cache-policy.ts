import {
  DEFAULT_PUBLIC_REVALIDATE_SECONDS,
  DEFAULT_STALE_WHILE_REVALIDATE_SECONDS,
} from './transport-policy';

//===================================================================

const MAX_PUBLIC_CACHE_SECONDS = 86_400;

//===================================================================

export function validateCacheSeconds(
  value: number,
  label: string
): number {
  if (
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_PUBLIC_CACHE_SECONDS
  ) {
    throw new RangeError(`${label} must be an integer from 0 to 86400.`);
  }

  return value;
}

//===================================================================

export function resolvePublicRevalidate(
  value: number | false | undefined
): number | false {
  if (value === false) return false;
  
  return validateCacheSeconds(
    value ?? DEFAULT_PUBLIC_REVALIDATE_SECONDS,
    'Public revalidate'
  );
}

//===================================================================

export function createPublicCacheControl(
  revalidate: number | false,
  staleWhileRevalidate = DEFAULT_STALE_WHILE_REVALIDATE_SECONDS
): string {
  if (revalidate === false || revalidate === 0) return 'no-store';

  const staleSeconds = validateCacheSeconds(
    staleWhileRevalidate,
    'Public stale-while-revalidate'
  );

  return staleSeconds > 0
    ? `public, s-maxage=${revalidate}, stale-while-revalidate=${staleSeconds}`
    : `public, s-maxage=${revalidate}`;
}
