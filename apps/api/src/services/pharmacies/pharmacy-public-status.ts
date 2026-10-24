import { PHARMACY_STATUSES } from '../../constants/auth/auth';

//===============================================================

export const PUBLIC_PHARMACY_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

//===================================================================

export const PUBLIC_PHARMACY_STATUS_FILTER = {
  $in: [...PUBLIC_PHARMACY_STATUSES],
};
