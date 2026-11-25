import { ReasonModal } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { ADMIN_PRODUCT_REQUEST_REJECTION_REASONS } from '@e-pharmacy/config/reasons';

import type { AdminRequestDetail } from '@/lib/product-requests/admin-product-request-detail';

import overviewCss from './AdminProductRequestOverview.module.css';
import css from './AdminProductRequests.module.css';

//===================================================================

export type ModerationAction = 'approved' | 'rejected' | 'changes_requested';

//===================================================================

const COPY = {
  approved: {
    title: 'Approve this product request?',
    confirmLabel: 'Approve request',
    description:
      'Approval creates or links a global product. This cannot be undone.',
    tone: 'accent',
  },

  changes_requested: {
    title: 'Request corrections?',
    confirmLabel: 'Request corrections',
    description:
      'The owner can correct the request and resubmit it. Moderation remains locked until then.',
    tone: 'moderation',
  },

  rejected: {
    title: 'Reject this product request?',
    confirmLabel: 'Reject request',
    description: 'The request becomes Rejected / Cancelled by Admin.',
    tone: 'danger',
  },
} as const;

//===================================================================

export function AdminProductRequestModerationModal({
  action,
  request,
  reason,
  categoryId,
  categories,
  categoriesError,
  busy,
  onReasonChange,
  onCategoryChange,
  onConfirm,
  onCancel,
}: Readonly<{
  action: ModerationAction;
  request: AdminRequestDetail;
  reason: string;
  categoryId: string;
  categories: readonly { id: string; name: string }[];
  categoriesError: boolean;
  busy: boolean;
  onReasonChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  const copy = COPY[action];
  const needsCategory = action === 'approved' && !request.category?.id;

  const common = {
    eyebrow: 'Product request status',
    ...copy,
    cancelLabel: 'Cancel',
    isLoading: busy,
    onCancel,
    onConfirm,

    headerDetails: (
      <div className={overviewCss.activityTransition}>
        <StatusBadge {...PRODUCT_REQUEST_STATUS_PRESENTATION.on_moderation} />
        <span aria-hidden="true">→</span>
        <StatusBadge
          {...PRODUCT_REQUEST_STATUS_PRESENTATION[
            action === 'changes_requested' ? 'on_moderation' : action
          ]}
        />
        {action === 'changes_requested' ? (
          <StatusBadge label="Needs changes" tone="neutral" />
        ) : null}
        {action === 'rejected' ? (
          <StatusBadge
            label="Cancelled by Admin"
            tone="neutral"
            className={overviewCss.activityCancellationBadge}
          />
        ) : null}
      </div>
    ),
  };

  if (action === 'approved') {
    return (
      <ReasonModal
        {...common}
        withoutReason
        confirmDisabled={needsCategory && !categoryId}
        details={
          needsCategory ? (
            <label className={css.reason}>
              Catalog category *
              <select
                required
                value={categoryId}
                disabled={busy}
                onChange={(event) => onCategoryChange(event.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoriesError ? (
                <span>Could not load categories. Close and retry.</span>
              ) : null}
            </label>
          ) : undefined
        }
      />
    );
  }

  return (
    <ReasonModal
      {...common}
      reasonOptions={
        action === 'rejected'
          ? ADMIN_PRODUCT_REQUEST_REJECTION_REASONS
          : undefined
      }
      value={reason}
      fieldName="productRequestModerationReason"
      fieldLabel="Reason for Admin feedback"
      placeholder="Explain why this moderation decision is necessary..."
      maxLength={1000}
      error={reason.trim() ? '' : 'Reason is required.'}
      onValueChange={onReasonChange}
    />
  );
}
