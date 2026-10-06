export type FormattablePharmacyLocation = Readonly<{
  address?: string | null;
  settlement?: string | null;
  region?: string | null;
}>;

//===================================================================

/**
 * Formats a pharmacy location for display without leaking presentation logic
 * into individual cards, forms, or moderation views.
 */
export function formatPharmacyLocation(
  location?: FormattablePharmacyLocation | null
): string {
  if (!location) return '';

  return [location.address, location.settlement, location.region]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .join(', ');
}
