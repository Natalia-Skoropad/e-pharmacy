import { ShieldAlert } from 'lucide-react';

import { Button } from '@e-pharmacy/ui/common';
import { formatPrice } from '@e-pharmacy/utils/formatters';
import type { CheckoutPharmacyOrderGroup } from '@/lib/checkout/checkout-types';

import css from './CheckoutOrderPanel.module.css';

//===================================================================

type CheckoutOrderPanelProps = {
  orderGroup: CheckoutPharmacyOrderGroup;
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
      <h2 className={css.title} id="order-title">
        Pharmacy order
      </h2>

      <div className={css.orderCard}>
        <h3>{orderGroup.pharmacyName}</h3>
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
          <dd>{formatPrice(orderGroup.totalPrice)}</dd>
        </div>
      </dl>

      <Button type="button" fullWidth disabled={!canSubmit} onClick={onSubmit}>
        {isSubmitting ? 'Confirming...' : 'Confirm order'}
      </Button>
    </aside>
  );
}

export default CheckoutOrderPanel;
