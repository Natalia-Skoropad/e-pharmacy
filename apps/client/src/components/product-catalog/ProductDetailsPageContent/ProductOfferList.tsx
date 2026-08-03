'use client';

import type { ProductOffer } from '@e-pharmacy/types/products';

import {
  ProductOfferCard,
  type ProductOfferCardProps,
} from './ProductOfferCard';

import css from './ProductOfferList.module.css';

//===================================================================

type OfferState = Omit<ProductOfferCardProps, 'offer'>;

//===================================================================

export type ProductOfferListProps = Readonly<{
  offers: readonly ProductOffer[];
  getOfferState: (offer: ProductOffer) => OfferState;
}>;

//===================================================================

export function ProductOfferList({
  offers,
  getOfferState,
}: ProductOfferListProps) {
  return (
    <ul className={css.list}>
      {offers.map((offer) => (
        <li className={css.item} key={offer.id}>
          <ProductOfferCard offer={offer} {...getOfferState(offer)} />
        </li>
      ))}
    </ul>
  );
}
