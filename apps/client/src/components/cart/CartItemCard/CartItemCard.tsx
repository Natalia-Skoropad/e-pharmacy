import {
  Button,
  ButtonLink,
  QuantityCounter,
  RatingSummary,
  ShimmerImage,
  SvgIcon,
} from '@e-pharmacy/ui/common';

import { formatMoney } from '@e-pharmacy/utils/money';
import type { CartItem } from '@e-pharmacy/types';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';

import { StockAvailability } from '@/components/common';
import { buildProductPath } from '@/lib/routes';

import css from './CartItemCard.module.css';

//===================================================================

type CartItemCardProps = {
  item: CartItem;
  isUpdating?: boolean;
  onQuantityChange: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
};

//===================================================================

function CartItemCard({
  item,
  isUpdating = false,
  onQuantityChange,
  onRemove,
}: CartItemCardProps) {
  const productHref = buildProductPath(item.product.name, item.product.id);
  const stockQuantity = Math.max(
    item.stockQuantity ?? item.quantity,
    item.quantity
  );

  return (
    <article className={css.card} aria-labelledby={`cart-item-${item.id}`}>
      <div className={css.imageWrap}>
        {item.product.imageUrl ? (
          <ShimmerImage
            className={css.image}
            src={item.product.imageUrl}
            alt={item.product.name}
            sizes="(max-width: 767px) calc(100vw - 88px), 140px"
          />
        ) : (
          <div className={css.imageFallback} aria-hidden="true">
            <SvgIcon name="icon-shopping-cart" size={28} />
          </div>
        )}
      </div>

      <div className={css.content}>
        <div className={css.head}>
          <div>
            <p className={css.category}>
              {PRODUCT_CATEGORY_LABELS[item.product.category] ??
                item.product.category}
            </p>

            <h2 className={css.title} id={`cart-item-${item.id}`}>
              {item.product.name}
            </h2>

            <RatingSummary
              className={css.rating}
              rating={item.product.rating}
              reviewsCount={item.product.reviewsCount ?? 0}
              size="sm"
            />
          </div>

          <dl className={css.prices}>
            <div className={css.totalPriceRow}>
              <dt>Total amount</dt>
              <dd>{formatMoney(item.totalPrice) ?? '—'}</dd>
            </div>
            <div className={css.unitPriceRow}>
              <dt>Unit price</dt>
              <dd>{formatMoney(item.unitPrice) ?? '—'}</dd>
            </div>
          </dl>
        </div>

        <div className={css.footer}>
          <div className={css.quantityBlock}>
            <QuantityCounter
              value={item.quantity}
              min={1}
              max={stockQuantity}
              isLoading={isUpdating}
              ariaLabel={`Quantity controls for ${item.product.name}`}
              onDecrement={() => onQuantityChange(item.id, item.quantity - 1)}
              onIncrement={() => onQuantityChange(item.id, item.quantity + 1)}
            />

            <StockAvailability
              className={css.stock}
              stockQuantity={stockQuantity}
            />
          </div>

          <div className={css.actions}>
            <ButtonLink href={productHref} variant="secondary" size="sm">
              Product details
            </ButtonLink>

            <Button
              className={css.removeButton}
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={() => onRemove(item.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default CartItemCard;
