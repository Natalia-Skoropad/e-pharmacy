const CANONICAL_POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export const MAX_CATALOG_SEGMENTS = 12;

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

//===================================================================

export type CatalogSearchParamValue = string | string[] | undefined;
export type CatalogSearchParams = Record<string, CatalogSearchParamValue>;

//===================================================================

export function getSingleSearchParam(
  value: CatalogSearchParamValue
): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

//===================================================================

export function hasCatalogSearchParams(
  params?: CatalogSearchParams
): boolean {
  return Boolean(params && Object.keys(params).length > 0);
}
