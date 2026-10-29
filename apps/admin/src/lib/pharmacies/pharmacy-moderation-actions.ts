import type {
  AdminPharmacyDetail,
  AdminPharmacyModerationDecisionPayload,
} from '@e-pharmacy/types/admin';

//===================================================================

export type PharmacyModerationAction =
  AdminPharmacyModerationDecisionPayload['action'];

export type PharmacyModerationOption = Readonly<{
  action: PharmacyModerationAction;
  label: string;
  targetStatus: AdminPharmacyDetail['status'];
  description: string;
  feedbackVisibleToOwner: boolean;
  danger: boolean;
}>;

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
      const options: PharmacyModerationOption[] = [];

      if (reviewState !== 'changes_requested' && ownerCanOperate) {
        options.push({
          action: status === 'on_reactivation' ? 'review_reactivation' : 'approve',

          label:
            status === 'on_reactivation' ? 'Approve reactivation' : status === 'on_verification'
              ? 'Approve & activate'
              : 'Approve changes',

          targetStatus: status === 'on_reactivation' && !pharmacy.dates.activatedAt
            ? 'on_verification'
            : 'active',

          description:
            status === 'on_reactivation'
              ? pharmacy.dates.activatedAt
                ? 'Approve the frozen submitted reactivation details and restore availability.'
                : 'Approve the frozen reactivation details and return this never-activated pharmacy to initial verification. It will remain unavailable to customers.'
              : status === 'on_verification'
              ? 'Approve the registration and activate this pharmacy. The owner will be able to operate it.'
              : 'Publish the pending changes atomically. Until approval, the previously approved pharmacy remains available to customers.',

          feedbackVisibleToOwner: false,
          danger: false,
        });
      }

      if (reviewState !== 'changes_requested') options.push({
        action: 'request_corrections',
        label: 'Request corrections',
        targetStatus: status,

        description:
          status === 'on_moderation'
            ? 'Keep On moderation and the published pharmacy operational. The owner will see your comments, edit the pending draft and resubmit it.'
            : status === 'on_reactivation'
              ? 'Keep the pharmacy unavailable. The owner will see your comments, correct the saved draft and resubmit the reactivation request.'
              : 'Keep On verification. The owner will see your comments and may correct and resubmit their registration.',

        feedbackVisibleToOwner: true,
        danger: false,
      });

      if (status === 'on_reactivation' && reviewState !== 'changes_requested') options.push({
        action: 'reject_reactivation',
        label: 'Reject reactivation', targetStatus: 'blocked',
        description: 'Reject this request with a reason; pharmacy remains unavailable.',
        feedbackVisibleToOwner: true, danger: true,
      });

      if (status !== 'on_reactivation') options.push({
        action: 'block',
        label: 'Block pharmacy',
        targetStatus: 'blocked',

        description:
          'Take the pharmacy offline. Emergency blocking does not discard unfinished orders. The reason will be shown to the owner.',

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
      if (!ownerCanOperate || pharmacy.blockSource !== 'admin_blocked') return [];
      return [
        {
          action: 'review_reactivation',
          label: 'Review reactivation',

          targetStatus: pharmacy.dates.activatedAt
            ? 'active'
            : 'on_verification',

          description: pharmacy.dates.activatedAt
            ? 'Explicitly reactivate the previously approved pharmacy. It will become operational again; pending drafts are not published.'
            : 'Send this never-activated pharmacy back for initial verification. It will not start selling products.',

          feedbackVisibleToOwner: false,
          danger: false,
        },
      ];
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
