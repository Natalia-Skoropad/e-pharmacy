import { ShieldAlert } from 'lucide-react';

import { formatInitials, RatingSummary } from '@e-pharmacy/ui/data-display';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { Button } from '@e-pharmacy/ui/primitives';
import { formatMoney } from '@e-pharmacy/utils/money';
import type { CartPharmacyGroup } from '@/lib/cart/cart-groups';

import css from './CheckoutOrderPanel.module.css';

//===================================================================

type CheckoutOrderPanelProps = {
  orderGroup: CartPharmacyGroup;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
};

//===================================================================

function CheckoutOrderPanel({
  orderGroup,
  canSubmit,
  isSubmitting,
  onSubmit,
}: CheckoutOrderPanelProps) {
  return (
    <aside className={css.panel} aria-labelledby="order-title">
      <div className={css.orderCard}>
        <TableImagePreview
          src={orderGroup.pharmacyImageUrl}
          alt={`${orderGroup.pharmacyName} photo`}
          fallback={formatInitials(orderGroup.pharmacyName, 'P')}
          size={64}
        />

        <div className={css.orderIdentity}>
          <p className={css.orderKicker}>Pharmacy order</p>
          <h2 className={css.orderName} id="order-title">
            {orderGroup.pharmacyName}
          </h2>
          <RatingSummary
            rating={orderGroup.pharmacyRating}
            reviewsCount={orderGroup.pharmacyReviewsCount ?? 0}
            size="sm"
          />
        </div>
      </div>

      <div className={css.policyNotice}>
        <ShieldAlert size={20} aria-hidden="true" />
        <p>
          Pharmacy products are non-returnable and non-exchangeable after
          confirmation. Please check the order carefully before payment.
        </p>
      </div>

      <dl className={css.totalList}>
        <div>
          <dt>Total items</dt>
          <dd>{orderGroup.totalItems}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatMoney(orderGroup.totalPrice) ?? '—'}</dd>
        </div>
      </dl>

      <Button
        type="button"
        fullWidth
        disabled={!canSubmit}
        isLoading={isSubmitting}
        loadingLabel="Confirming..."
        onClick={onSubmit}
      >
        Confirm order
      </Button>
    </aside>
  );
}

export default CheckoutOrderPanel;
