import { CircleAlert, PackageSearch, Trash2 } from 'lucide-react';

import { CategoryIcon } from '@e-pharmacy/ui/forms';
import { Button, SvgIcon } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { QuantityCounter } from '@e-pharmacy/ui/forms';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { ShimmerImage } from '@e-pharmacy/ui/media';

import { CART_ITEM_MAX_QUANTITY } from '@e-pharmacy/config/cart';
import { formatMoney } from '@e-pharmacy/utils/money';
import type { CartItem } from '@e-pharmacy/types/cart';

import { buildProductPath } from '@/lib/routes';
import {
  getRemainingCartStock,
  hasCartItemStockConflict,
} from '@/lib/cart/cart-stock';

import { StockAvailability } from '@/components/common';

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
  const hasStockConflict = hasCartItemStockConflict(item);
  const maxQuantity = Math.min(item.stockQuantity, CART_ITEM_MAX_QUANTITY);

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
        <div className={css.leftColumn}>
          <div className={css.productInfo}>
            <p className={css.category}>
              <CategoryIcon name={item.product.category.icon} size={16} />
              {item.product.category.name}
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

          <div className={css.quantityBlock}>
            <QuantityCounter
              value={item.quantity}
              min={1}
              max={maxQuantity}
              isLoading={isUpdating}
              ariaLabel={`Quantity controls for ${item.product.name}`}
              onDecrement={() => onQuantityChange(item.id, item.quantity - 1)}
              onIncrement={() => onQuantityChange(item.id, item.quantity + 1)}
            />

            <StockAvailability
              className={css.stock}
              stockQuantity={getRemainingCartStock(
                item.stockQuantity,
                item.quantity
              )}
            />
          </div>
        </div>

        <div className={css.rightColumn}>
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

          {hasStockConflict ? (
            <p className={css.stockWarning} role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              <span>
                {item.stockQuantity === 0
                  ? 'This product has been reserved by another order and is currently unavailable. Remove it to continue to checkout.'
                  : `Only ${item.stockQuantity} available. Decrease the quantity to continue to checkout.`}
              </span>
            </p>
          ) : null}

          <div className={css.actions}>
            <LinkButton
              href={productHref}
              variant="secondary"
              size="sm"
              iconLeft={<PackageSearch size={16} aria-hidden="true" />}
            >
              Product details
            </LinkButton>

            <Button
              className={css.removeButton}
              type="button"
              variant="ghost"
              size="sm"
              iconLeft={<Trash2 size={16} aria-hidden="true" />}
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
