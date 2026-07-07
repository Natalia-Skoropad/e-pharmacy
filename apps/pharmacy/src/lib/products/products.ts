import { isProductCategory } from '@e-pharmacy/types/products';
import { normalizePaginatedResponse } from '@e-pharmacy/utils/api';

import {
  getNumberValue,
  getStringValue,
  isRecord,
} from '@e-pharmacy/utils/guards';

import type {
  EntityId,
  ProductCategory,
  ProductStatus,
} from '@e-pharmacy/types';

//===================================================================

export const OWN_PRODUCT_STATUSES = [
  'active',
  'blocked',
] as const satisfies readonly ProductStatus[];

export const STOCK_AVAILABILITY_FILTERS = [
  'available',
  'empty',
] as const;

//===================================================================

export type OwnProductStatus = (typeof OWN_PRODUCT_STATUSES)[number];

export type StockAvailabilityFilter =
  (typeof STOCK_AVAILABILITY_FILTERS)[number];

//===================================================================

export type PharmacyProductRow = Readonly<{
  id: EntityId;
  addedAt: string;
  article: string;
  name: string;
  category: ProductCategory;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  currentPrice: number;
  imageUrl?: string;
  status: OwnProductStatus;
}>;

export type PharmacyProductsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  pharmacyId?: EntityId;
  addedFrom?: string;
  addedTo?: string;
  name?: string;
  article?: string;
  category?: ProductCategory;
  status?: OwnProductStatus;
  stock?: StockAvailabilityFilter;
}>;

export type PharmacyProductsResponse = Readonly<{
  items: PharmacyProductRow[];
  total: number;
}>;

//===================================================================

export const PRODUCT_STATUS_LABELS: Record<OwnProductStatus, string> = {
  active: 'Active',
  blocked: 'Blocked',
};

export const STOCK_AVAILABILITY_LABELS: Record<
  StockAvailabilityFilter,
  string
> = {
  available: 'Available',
  empty: 'Empty',
};

//===================================================================

function isOwnProductStatus(value: unknown): value is OwnProductStatus {
  return OWN_PRODUCT_STATUSES.includes(value as OwnProductStatus);
}

//===================================================================

function getProductId(product: Record<string, unknown>): string | undefined {
  return getStringValue(product.id) ?? getStringValue(product._id);
}

//===================================================================

function getOfferId(offer: Record<string, unknown>): string | undefined {
  return getStringValue(offer.id) ?? getStringValue(offer._id);
}

//===================================================================

function getOfferPharmacyId(
  offer: Record<string, unknown>
): string | undefined {
  return getStringValue(offer.pharmacyId);
}

//===================================================================

function getProductOffer(
  product: Record<string, unknown>,
  pharmacyId?: EntityId
): Record<string, unknown> | undefined {
  const offers = Array.isArray(product.offers) ? product.offers : [];

  const productOffer = offers.find(
    (offer): offer is Record<string, unknown> => {
      if (!isRecord(offer)) return false;

      if (!pharmacyId) return Boolean(getOfferId(offer));

      return getOfferPharmacyId(offer) === String(pharmacyId);
    }
  );

  return isRecord(productOffer) ? productOffer : undefined;
}

//===================================================================

function getStockQuantity(offer: Record<string, unknown>): number {
  return (
    getNumberValue(offer.stockQuantity) ??
    getNumberValue(offer.totalQuantity) ??
    0
  );
}

//===================================================================

function getReservedQuantity(offer: Record<string, unknown>): number {
  return getNumberValue(offer.reservedQuantity) ?? 0;
}

//===================================================================

function getAvailableQuantity(offer: Record<string, unknown>): number {
  const stockQuantity = getStockQuantity(offer);
  const reservedQuantity = getReservedQuantity(offer);

  return (
    getNumberValue(offer.availableQuantity) ??
    Math.max(0, stockQuantity - reservedQuantity)
  );
}

//===================================================================

export function normalizePharmacyProduct(
  rawProduct: unknown,
  pharmacyId?: EntityId
): PharmacyProductRow | null {
  if (!isRecord(rawProduct)) return null;

  const id = getProductId(rawProduct);
  const offer = getProductOffer(rawProduct, pharmacyId);
  const category = rawProduct.category;
  const status = rawProduct.status;

  if (
    !id ||
    !offer ||
    !isProductCategory(category) ||
    !isOwnProductStatus(status)
  ) {
    return null;
  }

  return {
    id,
    addedAt:
      getStringValue(offer.addedAt) ??
      getStringValue(offer.createdAt) ??
      getStringValue(rawProduct.addedAt) ??
      getStringValue(rawProduct.updatedAt) ??
      '',
    article: getStringValue(rawProduct.article) ?? '—',
    name: getStringValue(rawProduct.name) ?? 'Product',
    category,
    stockQuantity: getStockQuantity(offer),
    reservedQuantity: getReservedQuantity(offer),
    availableQuantity: getAvailableQuantity(offer),
    currentPrice:
      getNumberValue(offer.currentPrice) ??
      getNumberValue(offer.price) ??
      getNumberValue(rawProduct.currentPrice) ??
      getNumberValue(rawProduct.price) ??
      0,
    imageUrl:
      getStringValue(rawProduct.imageUrl) ??
      getStringValue(rawProduct.pictureUrl) ??
      getStringValue(rawProduct.photoUrl),
    status,
  };
}

//===================================================================

export function normalizePharmacyProductsResponse(
  payload: unknown,
  pharmacyId?: EntityId
): PharmacyProductsResponse {
  return normalizePaginatedResponse(payload, {
    normalizeItem: (item) => normalizePharmacyProduct(item, pharmacyId),
  });
}

//===================================================================

export function getOwnProductBackendQuery(
  params: PharmacyProductsQueryParams
): Record<string, string | number | boolean | undefined> {
  return {
    page: params.page,
    perPage: params.perPage,
    pharmacyId: params.pharmacyId,
    addedFrom: params.addedFrom,
    addedTo: params.addedTo,
    nameKeyword: params.name,
    articleKeyword: params.article,
    category: params.category,
    status: params.status,
    inStock:
      params.stock === 'available'
        ? true
        : params.stock === 'empty'
          ? false
          : undefined,
  };
}
