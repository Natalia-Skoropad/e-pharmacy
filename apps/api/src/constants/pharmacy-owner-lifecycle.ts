export const PHARMACY_OWNER_LIFECYCLE_ERROR_CODES = {
  NOT_FOUND: 'PHARMACY_OWNER_NOT_FOUND',
  INVALID_TRANSITION: 'PHARMACY_OWNER_STATUS_TRANSITION_INVALID',
  HAS_ACTIVE_ORDERS: 'OWNER_HAS_ACTIVE_ORDERS',
  OWNER_REFERENCE_INVALID: 'PHARMACY_OWNER_REFERENCE_INVALID',
  OWNER_BLOCKED: 'PHARMACY_OWNER_BLOCKED',
} as const;

//===============================================================

export const PHARMACY_OWNER_AUTO_ACTIVATION_REASON =
  'Automatically activated when the first linked pharmacy became active.';

export const PHARMACY_OWNER_ACTIVE_ORDER_STATUSES = [
  'new',
  'in_progress',
] as const;
