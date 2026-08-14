import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';

//===================================================================

export type PharmacyProfileAction =
  | 'edit'
  | 'submit_for_verification'
  | 'submit_for_moderation';

//===================================================================

export const PHARMACY_PROFILE_ACTIONS_BY_STATUS = {
  new: ['edit', 'submit_for_verification'],
  on_verification: [],
  on_moderation: [],
  active: ['edit', 'submit_for_moderation'],
  blocked: [],
} as const satisfies Record<PharmacyStatus, readonly PharmacyProfileAction[]>;

//===================================================================

export function canPharmacyProfilePerformAction(
  status: PharmacyStatus,
  action: PharmacyProfileAction
): boolean {
  return (
    PHARMACY_PROFILE_ACTIONS_BY_STATUS[
      status
    ] as readonly PharmacyProfileAction[]
  ).includes(action);
}
