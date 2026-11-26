import { ReasonModal } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { PRODUCT_REQUEST_STATUS_PRESENTATION as status } from '@e-pharmacy/config/presentation';
import { OWNER_PRODUCT_REQUEST_CANCEL_REASONS } from '@e-pharmacy/config/reasons';

import css from '../ProductRequestDetailsPageContent/ProductRequestOverview.module.css';

//===================================================================

export function ProductRequestCancelModal({
  reason,
  isLoading,
  onReasonChange,
  onConfirm,
  onCancel,
}: Readonly<{
  reason: string;
  isLoading: boolean;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
    <ReasonModal
      eyebrow="Product request status"
      title="Cancel product request?"
      description="The request becomes Rejected / Cancelled by owner. This cannot be undone."
      tone="danger"
      headerDetails={
        <div className={css.activityTransition}>
          <StatusBadge {...status.on_moderation} />
          <StatusBadge label="Needs changes" tone="neutral" />
          <span aria-hidden="true">→</span>
          <StatusBadge {...status.rejected} />
          <StatusBadge
            label="Cancelled by owner"
            tone="neutral"
            className={css.activityCancellationBadge}
          />
        </div>
      }
      reasonOptions={OWNER_PRODUCT_REQUEST_CANCEL_REASONS}
      value={reason}
      fieldName="productRequestCancellationReason"
      fieldLabel="Reason (visible to Admin)"
      placeholder="Explain why you are cancelling this request..."
      maxLength={1000}
      error={reason.trim() ? '' : 'Reason is required.'}
      onValueChange={onReasonChange}
      cancelLabel="Keep request"
      confirmLabel="Cancel request"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
