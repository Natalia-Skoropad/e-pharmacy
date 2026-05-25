import { ShieldAlert } from 'lucide-react';

import { Button, ButtonLink } from '@/components/common';

import { buildCheckoutPath } from '@/lib/checkout';
import { formatPrice } from '@/lib/formatters';

import css from './CartSummary.module.css';

//===================================================================

type CartSummaryProps = {
  storeId: string;
  storeName?: string | null;
  totalItems: number;
  totalPrice: number;
  isUpdating?: boolean;
  onContinueShopping: () => void;
};

//===================================================================

function CartSummary({
  storeId,
  storeName,
  totalItems,
  totalPrice,
  isUpdating = false,
  onContinueShopping,
}: CartSummaryProps) {
  return (
    <aside className={css.card} aria-labelledby={`cart-summary-${storeId}`}>
      <h2 className={css.title} id={`cart-summary-${storeId}`}>
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
          Medicines are non-returnable and non-exchangeable after order
          confirmation.
        </p>
      </div>

      <div className={css.actions}>
        <ButtonLink href={buildCheckoutPath(storeName, storeId)} fullWidth>
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
