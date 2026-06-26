import type { PharmacyStatus } from '@e-pharmacy/types';

//===================================================================

export const PHARMACY_STATUS_LABELS: Record<PharmacyStatus, string> = {
  new: 'New',
  on_verification: 'On verification',
  active: 'Active',
  on_moderation: 'On moderation',
  blocked: 'Blocked',
};

//===================================================================

export function isNewPharmacy(status?: PharmacyStatus): boolean {
  return status === 'new';
}

//===================================================================

export function canUseBusinessFeatures(status?: PharmacyStatus): boolean {
  return status === 'active' || status === 'on_moderation';
}

//===================================================================

export function canCreateProductRequests(status?: PharmacyStatus): boolean {
  return canUseBusinessFeatures(status);
}

//===================================================================

export function getNewPharmacyLockedMessage(featureName: string): string {
  return `${featureName} becomes available after Admin verifies your pharmacy profile. Complete the required profile sections and send the pharmacy for verification first.`;
}
