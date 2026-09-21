import { PHARMACY_STATUSES } from './auth';

//===============================================================

type PharmacyStatus =
  (typeof PHARMACY_STATUSES)[keyof typeof PHARMACY_STATUSES];

//===============================================================

export const PHARMACY_OPERATIONAL_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

//===============================================================

export function isPharmacyOperationalStatus(status: PharmacyStatus): boolean {
  return (PHARMACY_OPERATIONAL_STATUSES as readonly PharmacyStatus[]).includes(
    status
  );
}
