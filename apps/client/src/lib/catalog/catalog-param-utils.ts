const CANONICAL_POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

//===================================================================

export function parsePositivePageParam(value?: string): number {
  if (!value || !CANONICAL_POSITIVE_INTEGER_PATTERN.test(value)) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 1;
}

//===================================================================

export function isCanonicalPositivePageParam(value?: string): boolean {
  if (!value || !CANONICAL_POSITIVE_INTEGER_PATTERN.test(value)) return false;
  return Number.isSafeInteger(Number(value));
}
