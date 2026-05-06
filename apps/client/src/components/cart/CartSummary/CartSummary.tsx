import { Button, ButtonLink } from '@/components/common';

import { ROUTES } from '@/lib/constants/routes';

import type { Cart } from '@/types';

import css from './CartSummary.module.css';

//===================================================================

type CartSummaryProps = {
  cart: Cart;
  isUpdating?: boolean;
  onClear: () => void;
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

function CartSummary({ cart, isUpdating = false, onClear }: CartSummaryProps) {
  const isEmpty = cart.items.length === 0;

  return (
    <aside className={css.card} aria-labelledby="cart-summary-title">
      <h2 className={css.title} id="cart-summary-title">
        Order summary
      </h2>

      <dl className={css.list}>
        <div className={css.row}>
          <dt>Items</dt>
          <dd>{cart.totalItems}</dd>
        </div>

        <div className={css.row}>
          <dt>Total</dt>
          <dd>{formatPrice(cart.totalPrice)}</dd>
        </div>
      </dl>

      <div className={css.actions}>
        <ButtonLink
          href={ROUTES.CHECKOUT}
          fullWidth
          aria-disabled={isEmpty}
          tabIndex={isEmpty ? -1 : undefined}
        >
          Continue to checkout
        </ButtonLink>

        <Button
          type="button"
          variant="ghost"
          fullWidth
          disabled={isEmpty || isUpdating}
          onClick={onClear}
        >
          Clear cart
        </Button>
      </div>
    </aside>
  );
}

export default CartSummary;
