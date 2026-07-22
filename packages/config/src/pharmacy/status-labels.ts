import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

//===================================================================

export const PHARMACY_STATUS_LABELS: Record<PharmacyStatus, string> = {
  new: 'New',
  on_verification: 'On verification',
  active: 'Active',
  on_moderation: 'On moderation',
  blocked: 'Blocked',
};
