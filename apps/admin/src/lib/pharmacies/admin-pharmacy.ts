import { isValidObjectId } from '@e-pharmacy/validation/url';

//===================================================================

// Shared admin pharmacy identifiers and supported registry facets.
export const ADMIN_PHARMACY_STATUSES = [
  'new',
  'on_verification',
  'active',
  'on_moderation',
  'on_reactivation',
  'blocked',
] as const;

export const ADMIN_PHARMACY_RATINGS = [
  '0-0.9',
  '1-1.9',
  '2-2.9',
  '3-3.9',
  '4-5',
] as const;

//===================================================================

export type AdminPharmacyStatus = (typeof ADMIN_PHARMACY_STATUSES)[number];
export type AdminPharmacyRating = (typeof ADMIN_PHARMACY_RATINGS)[number];

//===================================================================

export function assertAdminPharmacyId(
  value: string,
  label = 'pharmacy id'
): string {
  if (!isValidObjectId(value)) throw new TypeError(`Invalid ${label}.`);

  return value.toLowerCase();
}
