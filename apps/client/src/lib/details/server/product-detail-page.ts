import 'server-only';
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

export function createProductDetailMetadata(product: ProductDetails): Metadata {
  return createPageMetadata({
    title: product.name,

    description:
      product.description ??
      `Buy ${product.name} online from E-PHARMACY. Check pharmacy prices, availability, dosage, manufacturer, and product details.`,

    path: buildProductPath(product.name, product.id, product.publicSlugId),

    image: product.imageUrl,
    imageAlt: product.name,
  });
}
