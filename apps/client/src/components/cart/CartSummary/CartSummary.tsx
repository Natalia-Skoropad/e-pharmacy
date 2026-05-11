import { Button, ButtonLink } from '@/components/common';

import { buildCheckoutPath } from '@/lib/checkout';

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

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(price);
}

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
