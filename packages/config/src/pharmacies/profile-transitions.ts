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
  blocked: ['edit'],
  on_reactivation: [],
} as const satisfies Record<PharmacyStatus, readonly PharmacyProfileAction[]>;

//===================================================================

export function canPharmacyProfilePerformAction(
  status: PharmacyStatus,
  action: PharmacyProfileAction,
  reviewState?: 'pending' | 'changes_requested'
): boolean {
  if (status === 'blocked' && reviewState === 'pending') return false;

  if (
    (status === 'on_verification' ||
      status === 'on_moderation' ||
      status === 'on_reactivation') &&
    reviewState === 'changes_requested'
  ) {
    return (
      action === 'edit' ||
      (status === 'on_verification'
        ? action === 'submit_for_verification'
        : status === 'on_moderation'
          ? action === 'submit_for_moderation'
          : false)
    );
  }

  return (
    PHARMACY_PROFILE_ACTIONS_BY_STATUS[
      status
    ] as readonly PharmacyProfileAction[]
  ).includes(action);
}
