import {
  buildOwnedPharmaciesListUrl,
  parseOwnedPharmaciesListSegments,
  type OwnedPharmacyListUrlState,
} from '@/lib/pharmacies/owned-pharmacy-url';

import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

/** Reuse the registry's canonical filter grammar without leaking it into a different route. */
export function buildClientPharmaciesPath(
  clientId: string,
  state: OwnedPharmacyListUrlState
): string {
  // Rating is not a filter on client pharmacy pages; keep it available
  // only in the owner-wide pharmacies registry.
  const suffix = buildOwnedPharmaciesListUrl({ ...state, rating: 'all' })
    .slice(PHARMACY_ROUTES.PHARMACIES.length)
    .replace(/\/created-from-/g, '/date-from-')
    .replace(/\/created-to-/g, '/date-to-');

  return `/pharmacy/clients/${clientId}/pharmacies${suffix}`;
}

//===================================================================

export function parseClientPharmaciesSegments(
  segments: readonly string[] = []
): OwnedPharmacyListUrlState {
  const state = parseOwnedPharmaciesListSegments(
    segments.map((segment) =>
      segment.startsWith('date-from-')
        ? `created-from-${segment.slice('date-from-'.length)}`
        : segment.startsWith('date-to-')
          ? `created-to-${segment.slice('date-to-'.length)}`
          : segment
    )
  );

  // Old rating URLs resolve to the canonical client route without a rating.
  return { ...state, rating: 'all' };
}
