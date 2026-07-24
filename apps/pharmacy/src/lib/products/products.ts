import { isProductCategory } from '@e-pharmacy/validation/products';
import { type OwnProductStatisticsCounts } from '@e-pharmacy/types/products';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from '@e-pharmacy/api-client/response';

import { isRecord } from '@e-pharmacy/utils/guards';
import { getFiniteNumber } from '@e-pharmacy/utils/numbers';
import { getTrimmedString } from '@e-pharmacy/utils/strings';

import type {
  ApiPaginationResponse,
  EntityId,
  ProductCategory,
  ProductStatus,
} from '@e-pharmacy/types';

import { DEFAULT_OWN_PRODUCT_STATISTICS } from '@/lib/statistics/defaults';

//===================================================================

export const OWN_PRODUCT_STATUSES = [
  'active',
  'blocked',
] as const satisfies readonly ProductStatus[];

export const STOCK_AVAILABILITY_FILTERS = [
  'in-stock',
  'available',
  'reserved',
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
  hasRelatedOrders: boolean;
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

export type PharmacyProductsResponse = Readonly<
  ApiPaginationResponse<PharmacyProductRow> & {
    statistics: OwnProductStatisticsCounts;
    earliestCreatedAt: string | null;
  }
>;

//===================================================================

export const PRODUCT_STATUS_LABELS: Record<OwnProductStatus, string> = {
  active: 'Active',
  blocked: 'Blocked',
};

export const STOCK_AVAILABILITY_LABELS: Record<
  StockAvailabilityFilter,
  string
> = {
  'in-stock': 'Products in stock',
  available: 'Available products',
  reserved: 'Reserved products',
  empty: 'Out of stock',
};

//===================================================================

function isOwnProductStatus(value: unknown): value is OwnProductStatus {
  return OWN_PRODUCT_STATUSES.includes(value as OwnProductStatus);
}

//===================================================================

function getProductId(product: Record<string, unknown>): string | undefined {
  return getTrimmedString(product.id) ?? getTrimmedString(product._id);
}

//===================================================================

function getOfferId(offer: Record<string, unknown>): string | undefined {
  return getTrimmedString(offer.id) ?? getTrimmedString(offer._id);
}

//===================================================================

function getOfferPharmacyId(
  offer: Record<string, unknown>
): string | undefined {
  return getTrimmedString(offer.pharmacyId);
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
    getFiniteNumber(offer.stockQuantity) ??
    getFiniteNumber(offer.totalQuantity) ??
    0
  );
}

//===================================================================

function getReservedQuantity(offer: Record<string, unknown>): number {
  return getFiniteNumber(offer.reservedQuantity) ?? 0;
}

//===================================================================

function getAvailableQuantity(offer: Record<string, unknown>): number {
  const stockQuantity = getStockQuantity(offer);
  const reservedQuantity = getReservedQuantity(offer);

  return (
    getFiniteNumber(offer.availableQuantity) ??
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
      getTrimmedString(offer.addedAt) ??
      getTrimmedString(offer.createdAt) ??
      getTrimmedString(rawProduct.addedAt) ??
      getTrimmedString(rawProduct.updatedAt) ??
      '',

    article: getTrimmedString(rawProduct.article) ?? '—',
    name: getTrimmedString(rawProduct.name) ?? 'Product',
    category,
    stockQuantity: getStockQuantity(offer),
    reservedQuantity: getReservedQuantity(offer),
    availableQuantity: getAvailableQuantity(offer),

    currentPrice:
      getFiniteNumber(offer.currentPrice) ??
      getFiniteNumber(offer.price) ??
      getFiniteNumber(rawProduct.currentPrice) ??
      getFiniteNumber(rawProduct.price) ??
      0,

    imageUrl:
      getTrimmedString(rawProduct.imageUrl) ??
      getTrimmedString(rawProduct.pictureUrl) ??
      getTrimmedString(rawProduct.photoUrl),
    status,

    hasRelatedOrders: Boolean(offer.hasRelatedOrders),
  };
}

//===================================================================

function normalizeStatisticValue(value: unknown) {
  if (!isRecord(value)) return { quantity: 0 };

  const amount = getFiniteNumber(value.amount);

  return {
    quantity: getFiniteNumber(value.quantity) ?? 0,
    ...(typeof amount === 'number' ? { amount } : {}),
  };
}

//===================================================================

function normalizeOwnProductStatistics(
  value: unknown
): OwnProductStatisticsCounts {
  if (!isRecord(value)) return DEFAULT_OWN_PRODUCT_STATISTICS;

  return {
    inStock: normalizeStatisticValue(value.inStock),
    reserved: normalizeStatisticValue(value.reserved),
    available: normalizeStatisticValue(value.available),
    outOfStock: normalizeStatisticValue(value.outOfStock),
  };
}

//===================================================================

export function normalizePharmacyProductsResponse(
  payload: unknown,
  pharmacyId?: EntityId
): PharmacyProductsResponse {
  const response = requirePaginatedResponse(
    normalizePaginatedResponse(payload, {
      normalizeItem: (item) => normalizePharmacyProduct(item, pharmacyId),
    }),
    'pharmacy products response'
  );

  return {
    ...response,
    statistics: isRecord(payload)
      ? normalizeOwnProductStatistics(payload.ownProductStatistics)
      : DEFAULT_OWN_PRODUCT_STATISTICS,
    earliestCreatedAt: isRecord(payload)
      ? (getTrimmedString(payload.earliestCreatedAt) ?? null)
      : null,
  };
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
    stock: params.stock,
  };
}
