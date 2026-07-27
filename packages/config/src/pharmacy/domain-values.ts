import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

//===================================================================

export const PHARMACY_STATUSES = [
  'new',
  'on_verification',
  'on_moderation',
  'active',
  'blocked',
] as const satisfies readonly PharmacyStatus[];
