import 'server-only';
import { cache } from 'react';
import type { Metadata } from 'next';

import { isApiError } from '@e-pharmacy/api-client/transport';
import type { ProductDetails } from '@e-pharmacy/types/products';

import {
  getIdFromSlugId,
  getProductIdFromPublicSlugId,
} from '@e-pharmacy/validation/url';

import {
  getServerDataErrorContext,
  getProductDetails,
  PUBLIC_COMMERCE_CACHE_OPTIONS,
  type ServerDataErrorContext,
} from '@/lib/api/server';

import { buildProductPath } from '@/lib/routes';
import type { ProductTab } from '@/lib/routes/product-detail-tabs';

import {
  DEFAULT_PRODUCT_OFFERS_FILTERS,
  buildProductOffersPath,
  getProductOffersDescription,
  getProductOffersHeading,
  type ProductOffersFilters,
} from '@/lib/catalog/product-offers-paths';

import { createPageMetadata } from '@/lib/seo/server';

//===================================================================

export type ProductDetailLookupResult =
  | { status: 'found'; product: ProductDetails }
  | { status: 'not_found' }
  | ({ status: 'unavailable' } & ServerDataErrorContext);

//===================================================================

export async function lookupProductBySlugId(
  slugId: string
): Promise<ProductDetailLookupResult> {
  const productId =
    getProductIdFromPublicSlugId(slugId) ?? getIdFromSlugId(slugId);

  if (!productId) return { status: 'not_found' };

  try {
    const productData = await getProductDetails(
      productId,
      PUBLIC_COMMERCE_CACHE_OPTIONS
    );

    return productData.product
      ? { status: 'found', product: productData.product }
      : { status: 'not_found' };
  } catch (error) {
    if (isApiError(error) && error.httpStatus === 404) {
      return { status: 'not_found' };
    }

    return { status: 'unavailable', ...getServerDataErrorContext(error) };
  }
}

//===================================================================

// Reuse one server lookup for metadata and the page within the same request.
export const resolveProductBySlugId = cache(lookupProductBySlugId);

//===================================================================

export function createProductDetailMetadata(
  product: ProductDetails,
  tab: ProductTab = 'details',
  offerFilters?: ProductOffersFilters
): Metadata {
  const basePath = buildProductPath(
    product.name,
    product.id,
    product.publicSlugId
  );

  const selectedPharmacy = offerFilters?.pharmacyId
    ? product.offers.find(
        (offer) => offer.pharmacyId === offerFilters.pharmacyId
      )
    : undefined;

  const title =
    tab === 'pharmacies'
      ? getProductOffersHeading(
          product.name,
          offerFilters ?? DEFAULT_PRODUCT_OFFERS_FILTERS,
          selectedPharmacy?.pharmacyName
        )
      : tab === 'characteristics'
        ? `${product.name} characteristics`
        : tab === 'reviews'
          ? `${product.name} reviews`
          : product.name;

  const description =
    tab === 'pharmacies'
      ? getProductOffersDescription(
          product.name,
          offerFilters ?? DEFAULT_PRODUCT_OFFERS_FILTERS,
          selectedPharmacy?.pharmacyName
        )
      : tab === 'characteristics'
        ? `Explore ${product.name} characteristics, including its manufacturer, dosage, packaging and product information.`
        : tab === 'reviews'
          ? `Read client reviews of ${product.name} on E-PHARMACY and learn about other customers' experiences with this product.`
          : `Explore ${product.name} on E-PHARMACY. Compare pharmacy prices, availability, characteristics and client reviews before choosing a pharmacy.`;

  const tabPath =
    tab === 'details'
      ? basePath
      : tab === 'pharmacies'
        ? buildProductOffersPath(basePath, offerFilters)
        : `${basePath}/${tab}`;

  const isNonIndexableOfferPage =
    tab === 'pharmacies' &&
    Boolean(
      (offerFilters?.sort && offerFilters.sort !== 'newest') ||
      (offerFilters?.page && offerFilters.page > 1) ||
      (offerFilters?.pharmacyId && !selectedPharmacy)
    );

  const canonicalPath = isNonIndexableOfferPage
    ? buildProductOffersPath(basePath, {
        pharmacyId: offerFilters?.pharmacyId ?? '',
        settlement: offerFilters?.settlement ?? '',
        region: offerFilters?.region ?? '',
        sort: 'newest',
        page: 1,
      })
    : tabPath;

  return createPageMetadata({
    title,
    description,
    path: canonicalPath,
    image: product.imageUrl,
    imageAlt: `${product.name} product photo`,
    noIndex: isNonIndexableOfferPage,
  });
}
