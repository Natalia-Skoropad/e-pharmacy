import { ShieldAlert } from 'lucide-react';

import { Button, ButtonLink } from '@e-pharmacy/ui/common';
import { formatPrice } from '@e-pharmacy/utils/formatters';

import css from './CartSummary.module.css';

//===================================================================

type CartSummaryProps = {
  pharmacyId: string;
  totalItems: number;
  totalPrice: number;
  checkoutPath: string;
  isUpdating?: boolean;
  onContinueShopping: () => void;
};

//===================================================================

function CartSummary({
  pharmacyId,
  totalItems,
  totalPrice,
  checkoutPath,
  isUpdating = false,
  onContinueShopping,
}: CartSummaryProps) {
  return (
    <aside className={css.card} aria-labelledby={`cart-summary-${pharmacyId}`}>
      <h2 className={css.title} id={`cart-summary-${pharmacyId}`}>
        Order summary
      </h2>

      <dl className={css.list}>
        <div className={css.row}>
          <dt>Items</dt>
          <dd>{totalItems}</dd>
        </div>

        <div className={css.row}>
          <dt>Total</dt>
          <dd>{formatPrice(totalPrice)}</dd>
        </div>
      </dl>

      <div className={css.policyNotice}>
        <ShieldAlert size={18} aria-hidden="true" />
        <p>
          Products are non-returnable and non-exchangeable after order
          confirmation.
        </p>
      </div>

      <div className={css.actions}>
        <ButtonLink href={checkoutPath} fullWidth>
          Confirm order
        </ButtonLink>

        <Button
          type="button"
          variant="ghost"
          fullWidth
          disabled={isUpdating}
          onClick={onContinueShopping}
        >
          Continue shopping
        </Button>
      </div>
    </aside>
  );
}

export default CartSummary;
