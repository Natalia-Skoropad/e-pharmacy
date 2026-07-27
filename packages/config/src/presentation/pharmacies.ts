import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

//===================================================================

export const PHARMACY_STATUS_PRESENTATION = {
  new: { label: 'New', tone: 'info' },
  on_verification: { label: 'On verification', tone: 'info' },
  on_moderation: { label: 'On moderation', tone: 'pending' },
  active: { label: 'Active', tone: 'success' },
  blocked: { label: 'Blocked', tone: 'danger' },
} as const satisfies Readonly<
  Record<PharmacyStatus, Readonly<{ label: string; tone: string }>>
>;

//===================================================================

export function getPharmacyStatusPresentation(status: PharmacyStatus) {
  return PHARMACY_STATUS_PRESENTATION[status];
}
