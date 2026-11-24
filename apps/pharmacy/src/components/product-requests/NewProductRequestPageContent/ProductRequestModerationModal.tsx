import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';
import { ReasonModal } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import css from './ProductRequestModerationModal.module.css';

//===================================================================

const status = PRODUCT_REQUEST_STATUS_PRESENTATION;

//===================================================================

export function ProductRequestModerationModal({
  status: currentStatus,
  needsChanges,
  isLoading,
  onConfirm,
  onCancel,
}: Readonly<{
  status: ProductRequestStatus;
  needsChanges: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
    <ReasonModal
      eyebrow="PRODUCT REQUEST STATUS"
      title="Send request for moderation?"
      description="The administrator will review the submitted version. You cannot edit the product request while the review is pending. You can edit and resubmit after corrections are requested. This may take several days."
      headerDetails={
        <div className={css.reviewJourneyTransition}>
          <StatusBadge {...status[currentStatus]} />
          {needsChanges ? (
            <StatusBadge label="Needs changes" tone="neutral" />
          ) : null}
          <span aria-hidden="true">→</span>
          <StatusBadge {...status.on_moderation} />
        </div>
      }
      details={
        <section className={css.reviewJourney} aria-label="Moderation outcomes">
          <strong>What happens next?</strong>
          <ul className={css.reviewJourneyList}>
            <li className={css.reviewJourneyItem}>
              <div className={css.reviewJourneyBadges}>
                <StatusBadge {...status.approved} />
              </div>
              <span>Admin approves the request.</span>
            </li>
            <li className={css.reviewJourneyItem}>
              <div className={css.reviewJourneyBadges}>
                <StatusBadge {...status.on_moderation} />
                <StatusBadge label="Needs changes" tone="neutral" />
              </div>
              <span>Admin requests corrections.</span>
            </li>
            <li className={css.reviewJourneyItem}>
              <div className={css.reviewJourneyBadges}>
                <StatusBadge {...status.rejected} />
              </div>
              <span>Admin rejects the request.</span>
            </li>
          </ul>
        </section>
      }
      withoutReason
      tone="moderation"
      confirmLabel={
        currentStatus === 'on_moderation'
          ? 'Resend for moderation'
          : 'Send for moderation'
      }
      cancelLabel="Cancel"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
