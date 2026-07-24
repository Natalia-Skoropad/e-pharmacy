import { ShieldAlert } from 'lucide-react';

import { Button } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { formatMoney } from '@e-pharmacy/utils/money';

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
          <dd>{formatMoney(totalPrice) ?? '—'}</dd>
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
        <LinkButton href={checkoutPath} fullWidth>
          Confirm order
        </LinkButton>

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
