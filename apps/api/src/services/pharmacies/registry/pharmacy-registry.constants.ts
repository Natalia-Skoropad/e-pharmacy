import { PHARMACY_STATUSES } from '../../../constants/auth';

//===============================================================

// Rating labels use a decimal; ranges are mathematically gapless and the final
// interval includes 5. A missing rating is treated as 0 by registry queries.
export const RATING_BOUNDS = {
  '0-0.9': { min: 0, max: 1, inclusiveMax: false },
  '1-1.9': { min: 1, max: 2, inclusiveMax: false },
  '2-2.9': { min: 2, max: 3, inclusiveMax: false },
  '3-3.9': { min: 3, max: 4, inclusiveMax: false },
  '4-5': { min: 4, max: 5, inclusiveMax: true },
} as const;

//===============================================================

export const STATUS_FIELDS = [
  ['new', PHARMACY_STATUSES.NEW],
  ['onVerification', PHARMACY_STATUSES.ON_VERIFICATION],
  ['active', PHARMACY_STATUSES.ACTIVE],
  ['onModeration', PHARMACY_STATUSES.ON_MODERATION],
  ['blocked', PHARMACY_STATUSES.BLOCKED],
] as const;
