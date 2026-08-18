import { getIdFromSlugId } from '@e-pharmacy/validation/url';

//===================================================================

export const LEGACY_PUBLIC_ROUTE_POLICY = {
  precedence: 'product-first',
  reviewDate: '2026-11-30',
  minimumZeroTrafficDaysBeforeRemoval: 30,
} as const;

//===================================================================

type FoundLookupResult = Readonly<{ status: 'found' }>;
type NotFoundLookupResult = Readonly<{ status: 'not_found' }>;
type UnavailableLookupResult = Readonly<{ status: 'unavailable' }>;

type LookupResult =
  | FoundLookupResult
  | NotFoundLookupResult
  | UnavailableLookupResult;

type LegacyPublicEntityResolution<
  TProductResult extends LookupResult,
  TPharmacyResult extends LookupResult,
> =
  | Readonly<{
      entityType: 'product';
      result: Extract<TProductResult, FoundLookupResult>;
    }>
  | Readonly<{
      entityType: 'pharmacy';
      result: Extract<TPharmacyResult, FoundLookupResult>;
    }>
  | Readonly<{
      entityType: 'unavailable';
      result:
        | Extract<TProductResult, UnavailableLookupResult>
        | Extract<TPharmacyResult, UnavailableLookupResult>;
    }>
  | null;

//===================================================================

export async function resolveLegacyPublicEntity<
  TProductResult extends LookupResult,
  TPharmacyResult extends LookupResult,
>(
  slugId: string,
  lookups: Readonly<{
    lookupProduct: (slugId: string) => Promise<TProductResult>;
    lookupPharmacy: (slugId: string) => Promise<TPharmacyResult>;
  }>
): Promise<LegacyPublicEntityResolution<TProductResult, TPharmacyResult>> {
  if (!getIdFromSlugId(slugId)) return null;

  // Legacy untyped URLs are intentionally product-first. Typed pr/ph URLs do
  // not use this compatibility path and remain unambiguous.
  const productResult = await lookups.lookupProduct(slugId);
  if (productResult.status === 'found') {
    return {
      entityType: 'product',
      result: productResult as Extract<TProductResult, FoundLookupResult>,
    };
  }

  const pharmacyResult = await lookups.lookupPharmacy(slugId);
  if (pharmacyResult.status === 'found') {
    return {
      entityType: 'pharmacy',
      result: pharmacyResult as Extract<TPharmacyResult, FoundLookupResult>,
    };
  }

  if (productResult.status === 'unavailable') {
    return {
      entityType: 'unavailable',
      result: productResult as Extract<
        TProductResult,
        UnavailableLookupResult
      >,
    };
  }

  if (pharmacyResult.status === 'unavailable') {
    return {
      entityType: 'unavailable',
      result: pharmacyResult as Extract<
        TPharmacyResult,
        UnavailableLookupResult
      >,
    };
  }

  return null;
}

//===================================================================

export function logLegacyPublicRouteHit(
  entityType: 'product' | 'pharmacy',
  logger: Pick<Console, 'info'> = console
): void {
  logger.info(
    JSON.stringify({
      event: 'legacy_public_entity_route_hit',
      entityType,
      precedence: LEGACY_PUBLIC_ROUTE_POLICY.precedence,
      reviewDate: LEGACY_PUBLIC_ROUTE_POLICY.reviewDate,
    })
  );
}
