import type { ProductOffer } from '@/types';

import { formatPrice } from './format-price';

//===================================================================

export function formatPriceRange(offers: ProductOffer[]): string {
  const availableOffers = offers.filter(
    (offer) => offer.inStock && Number.isFinite(offer.price)
  );

  if (availableOffers.length === 0) return 'No pharmacy prices yet';

  const prices = availableOffers.map((offer) => offer.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) return formatPrice(minPrice);

  return `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;
}
