'use client';

import { Heart } from 'lucide-react';

import { CART_ITEM_TTL_DAYS } from '@e-pharmacy/config/cart';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { QuantityCounter } from '@e-pharmacy/ui/forms';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { SvgIcon } from '@e-pharmacy/ui/primitives';
import { formatMoney } from '@e-pharmacy/utils/money';
import type { CartItem } from '@e-pharmacy/types/cart';
import type { ProductOffer } from '@e-pharmacy/types/products';

import { getTelephoneHref } from '@/lib/contact/telephone';
import { buildPharmacyPath } from '@/lib/routes';

import { StockAvailability } from '@/components/common';

import css from './ProductOfferCard.module.css';

//===================================================================

export type ProductOfferCardProps = Readonly<{
  productName: string;
  offer: ProductOffer;
  cartItem: CartItem | null;
  pendingQuantity?: number;
  isPending: boolean;
  isItemPending: boolean;
  canUseCart: boolean;
  canShowStock: boolean;
  isFavoritePharmacy?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}>;

//===================================================================

function formatDaysCount(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

//===================================================================

function getOfferAddress(offer: ProductOffer): string {
  return [offer.pharmacyCity, offer.pharmacyAddress].filter(Boolean).join(', ');
}

//===================================================================

export function ProductOfferCard({
  productName,
  offer,
  cartItem,
  pendingQuantity,
  isPending,
  isItemPending,
  canUseCart,
  canShowStock,
  isFavoritePharmacy = offer.pharmacyIsFavorite,
  onIncrement,
  onDecrement,
}: ProductOfferCardProps) {
  const quantity = cartItem?.quantity ?? pendingQuantity ?? 0;
  const phoneHref = getTelephoneHref(offer.pharmacyPhone);

  return (
    <article className={css.card}>
      <div className={css.main}>
        <div className={css.imageWrap}>
          {isFavoritePharmacy ? (
            <span className={css.favoriteBadge}>
              <Heart
                className={css.favoriteIcon}
                size={14}
                fill="currentColor"
                aria-hidden="true"
              />
              Favorite pharmacy
            </span>
          ) : null}

          {offer.pharmacyImageUrl ? (
            <ShimmerImage
              className={css.image}
              src={offer.pharmacyImageUrl}
              alt={`${offer.pharmacyName} image`}
              sizes="500px"
              quality={90}
            />
          ) : (
            <SvgIcon name="icon-shopping-cart" size={32} />
          )}
        </div>

        <div className={css.info}>
          <h3 className={css.title}>{offer.pharmacyName}</h3>

          {getOfferAddress(offer) ? (
            <p className={css.address}>{getOfferAddress(offer)}</p>
          ) : null}

          {offer.pharmacyPhone ? (
            phoneHref ? (
              <a
                className={css.phone}
                href={phoneHref}
                aria-label={`Call ${offer.pharmacyName}: ${offer.pharmacyPhone}`}
              >
                {offer.pharmacyPhone}
              </a>
            ) : (
              <p className={css.phone}>{offer.pharmacyPhone}</p>
            )
          ) : null}

          <RatingSummary
            className={css.rating}
            rating={offer.pharmacyRating ?? 0}
            reviewsCount={offer.pharmacyReviewsCount ?? 0}
            size="sm"
          />
        </div>
      </div>

      <div className={css.aside}>
        <p className={css.price}>{formatMoney(offer.price) ?? '—'}</p>

        {offer.inStock ? (
          <div className={css.quantityBlock}>
            <QuantityCounter
              value={quantity}
              max={offer.availableQuantity}
              disabled={!canUseCart}
              isLoading={isPending || isItemPending}
              ariaLabel={`Quantity for ${productName} from ${offer.pharmacyName}`}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />

            <p className={css.totalLine}>
              Total: <b>{formatMoney(quantity * offer.price)}</b>
            </p>

            {canShowStock ? (
              <StockAvailability
                className={css.stockLine}
                stockQuantity={offer.availableQuantity}
              />
            ) : null}
          </div>
        ) : (
          <p className={css.unavailable}>
            Currently unavailable in this pharmacy.
          </p>
        )}

        <p className={css.cartNote}>
          The product stays in the cart for{' '}
          {formatDaysCount(CART_ITEM_TTL_DAYS)} and is removed if the order is
          not confirmed.
        </p>

        <LinkButton
          className={css.link}
          href={buildPharmacyPath(offer.pharmacyName, offer.pharmacyId)}
          variant="secondary"
        >
          View pharmacy
        </LinkButton>
      </div>
    </article>
  );
}
