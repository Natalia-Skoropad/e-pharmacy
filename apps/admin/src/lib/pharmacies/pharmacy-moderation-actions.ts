import type {
  AdminPharmacyDetail,
  AdminPharmacyModerationDecisionPayload,
} from '@e-pharmacy/types/admin';

//===================================================================

export type PharmacyModerationAction =
  AdminPharmacyModerationDecisionPayload['action'];

//===============================================================

export type PharmacyModerationOption = Readonly<{
  action: PharmacyModerationAction;
  label: string;
  targetStatus: AdminPharmacyDetail['status'];
  description: string;
  feedbackVisibleToOwner: boolean;
  danger: boolean;
}>;

//===============================================================

export const PHARMACY_MODERATION_REASON_MAX_LENGTH = 1000;

//===================================================================

/** Matches the canonical backend decision matrix. The API remains authoritative. */
export function getPharmacyModerationOptions(
  pharmacy: AdminPharmacyDetail
): PharmacyModerationOption[] {
  const { status, reviewState, owner } = pharmacy;

  // Newly registered owners stay `new` until their first pharmacy is approved.
  // Only blocked/missing owners must be excluded (same rule as the API).
  const ownerCanOperate = Boolean(owner && owner.status !== 'blocked');

  switch (status) {
    case 'new':
      // Registration is submitted by the owner, never by Admin setting `new`.
      return [];

    case 'on_verification':
    case 'on_moderation':
    case 'on_reactivation': {
      if (reviewState === 'changes_requested') {
        // The owner must resubmit first; disabled explanations are rendered
        // by PharmacyModerationActions for this state.
        return status === 'on_reactivation'
          ? []
          : [
              {
                action: 'block',
                label: 'Block pharmacy',
                targetStatus: 'blocked',
                description:
                  'Take the pharmacy offline. The reason is recorded in the audit.',
                feedbackVisibleToOwner: true,
                danger: true,
              },
            ];
      }

      const options: PharmacyModerationOption[] = [];

      if (ownerCanOperate) {
        options.push({
          action:
            status === 'on_reactivation' ? 'review_reactivation' : 'approve',

          label:
            status === 'on_reactivation'
              ? 'Approve reactivation'
              : status === 'on_verification'
                ? 'Approve & activate'
                : 'Approve changes',

          targetStatus: 'active',

          description:
            status === 'on_reactivation'
              ? 'Verify and publish only the frozen reactivation submission, then activate the pharmacy.'
              : status === 'on_verification'
                ? 'Approve the verified pharmacy and activate it.'
                : 'Publish the pending changes atomically after review.',

          feedbackVisibleToOwner: false,
          danger: false,
        });
      }

      options.push({
        action: 'request_corrections',
        label: 'Request corrections',
        targetStatus: status,

        description:
          status === 'on_reactivation'
            ? 'Keep the pharmacy unavailable. The owner can correct the draft and resubmit reactivation.'
            : status === 'on_moderation'
              ? 'Keep published data live and return the draft to the owner for corrections.'
              : 'Keep verification pending and request corrections from the owner.',

        feedbackVisibleToOwner: true,
        danger: false,
      });

      if (status !== 'on_reactivation')
        options.push({
          action: 'block',
          label: 'Block pharmacy',
          targetStatus: 'blocked',

          description:
            'Take the pharmacy offline. The reason is recorded in the audit.',

          feedbackVisibleToOwner: true,
          danger: true,
        });

      return options;
    }

    case 'active':
      return [
        {
          action: 'block',
          label: 'Block pharmacy',
          targetStatus: 'blocked',

          description:
            'Take the pharmacy offline. Emergency blocking does not discard unfinished orders. The reason will be shown to the owner.',

          feedbackVisibleToOwner: true,
          danger: true,
        },
      ];

    case 'blocked':
      // Reactivation must be submitted by the owner before any Admin review.
      return [];
  }
}
//===================================================================

export function validatePharmacyModerationReason(reason: string): string {
  const trimmed = reason.trim();

  if (!trimmed) return 'Reason is required.';

  if (trimmed.length > PHARMACY_MODERATION_REASON_MAX_LENGTH)
    return `Reason must be at most ${PHARMACY_MODERATION_REASON_MAX_LENGTH} characters.`;

  return '';
}
