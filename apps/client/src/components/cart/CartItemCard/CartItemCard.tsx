'use client';

import { Button, ButtonLink, ShimmerImage, SvgIcon } from '@/components/common';

import { buildProductPath } from '@/lib/routes';

import type { CartItem } from '@/types';

import css from './CartItemCard.module.css';

//===================================================================

type CartItemCardProps = {
  item: CartItem;
  isUpdating?: boolean;
  onQuantityChange: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
};

//===================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatReviewsCount(reviewsCount?: number): string {
  const count = reviewsCount ?? 0;

  if (count === 1) return '1 review';

  return `${count} reviews`;
}

//===================================================================

function CartItemCard({
  item,
  isUpdating = false,
  onQuantityChange,
  onRemove,
}: CartItemCardProps) {
  const productHref = buildProductPath(item.product.name, item.product.id);
  const canDecrease = item.quantity > 1;

  return (
    <article className={css.card} aria-labelledby={`cart-item-${item.id}`}>
      <div className={css.imageWrap}>
        {item.product.imageUrl ? (
          <ShimmerImage
            className={css.image}
            src={item.product.imageUrl}
            alt={item.product.name}
            sizes="120px"
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
            <h2 className={css.title} id={`cart-item-${item.id}`}>
              {item.product.name}
            </h2>

            <p className={css.reviews}>{formatReviewsCount(item.product.reviewsCount)}</p>
          </div>

          <p className={css.price}>{formatPrice(item.totalPrice)}</p>
        </div>

        <div className={css.footer}>
          <div className={css.quantity} aria-label="Quantity controls">
            <Button
              className={css.quantityButton}
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canDecrease || isUpdating}
              aria-label="Decrease quantity"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            >
              −
            </Button>

            <span className={css.quantityValue}>{item.quantity}</span>

            <Button
              className={css.quantityButton}
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              aria-label="Increase quantity"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            >
              +
            </Button>
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
