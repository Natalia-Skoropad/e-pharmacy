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
  const suffix = buildOwnedPharmaciesListUrl(state)
    .slice(PHARMACY_ROUTES.PHARMACIES.length)
    .replace(/\/created-from-/g, '/date-from-')
    .replace(/\/created-to-/g, '/date-to-');

  return `/pharmacy/clients/${clientId}/pharmacies${suffix}`;
}

//===================================================================

export function parseClientPharmaciesSegments(
  segments: readonly string[] = []
): OwnedPharmacyListUrlState {
  return parseOwnedPharmaciesListSegments(
    segments.map((segment) =>
      segment.startsWith('date-from-')
        ? `created-from-${segment.slice('date-from-'.length)}`
        : segment.startsWith('date-to-')
          ? `created-to-${segment.slice('date-to-'.length)}`
          : segment
    )
  );
}
