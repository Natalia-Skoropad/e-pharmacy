export const PHARMACY_PROFILE_MISSING_ERROR_CODE =
  'PHARMACY_PROFILE_MISSING' as const;

export const PHARMACY_PROFILE_BLOCKED_ERROR_CODE =
  'PHARMACY_PROFILE_BLOCKED' as const;

export const PHARMACY_PROFILE_LOCKED_ERROR_CODE =
  'PHARMACY_PROFILE_LOCKED' as const;

export const PHARMACY_PROFILE_INCOMPLETE_ERROR_CODE =
  'PHARMACY_PROFILE_INCOMPLETE' as const;

export const PHARMACY_NO_PENDING_CHANGES_ERROR_CODE =
  'PHARMACY_NO_PENDING_CHANGES' as const;

export const PHARMACY_PROFILE_ALREADY_SUBMITTED_ERROR_CODE =
  'PHARMACY_PROFILE_ALREADY_SUBMITTED' as const;

export const PHARMACY_OWNER_REQUIRED_ERROR_CODE =
  'PHARMACY_OWNER_REQUIRED' as const;

//===============================================================

export type PharmacyProfileAction =
  | 'edit'
  | 'submit_for_verification'
  | 'submit_for_moderation';

//===============================================================

export const PHARMACY_PROFILE_ACTIONS_BY_STATUS = {
  new: ['edit', 'submit_for_verification'],
  on_verification: [],
  on_moderation: [],
  active: ['edit', 'submit_for_moderation'],
  blocked: [],
} as const;

//===============================================================

export function canPharmacyProfilePerformAction(
  status: keyof typeof PHARMACY_PROFILE_ACTIONS_BY_STATUS,
  action: PharmacyProfileAction
): boolean {
  return (
    PHARMACY_PROFILE_ACTIONS_BY_STATUS[status] as readonly PharmacyProfileAction[]
  ).includes(action);
}
