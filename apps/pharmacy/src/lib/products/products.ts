import { PRODUCT_STATUSES } from '@e-pharmacy/config/products';
import { ApiError } from '@e-pharmacy/api-client/transport';
import {
  isISODateTimeString,
  isCalendarDateString,
} from '@e-pharmacy/validation/dates';
import { isProductCategory } from '@e-pharmacy/validation/products';
import { isValidObjectId } from '@e-pharmacy/validation/url';
import type { OwnProductStatisticsCounts } from '@e-pharmacy/types/products';

import {
  parseProductDetails,
  parseProductsWithOffersResponse,
} from '@e-pharmacy/api-client/response';

import { isRecord } from '@e-pharmacy/utils/guards';
import { getFiniteNumber } from '@e-pharmacy/utils/numbers';
import { getTrimmedString } from '@e-pharmacy/utils/strings';

import type { ApiPaginationResponse } from '@e-pharmacy/types/api';
import type { EntityId } from '@e-pharmacy/types/primitives';

import type {
  ProductCategory,
  ProductDetails,
} from '@e-pharmacy/types/products';

//===================================================================

export const OWN_PRODUCT_STATUSES = [
  'active',
  'blocked',
] as const satisfies readonly (typeof PRODUCT_STATUSES)[number][];

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

function invalidProductContract(message: string, payload: unknown): never {
  throw new ApiError(message, {
    transportCode: 'INVALID_RESPONSE',
    payload,
  });
}

//===================================================================

function isOwnProductStatus(value: unknown): value is OwnProductStatus {
  return OWN_PRODUCT_STATUSES.includes(value as OwnProductStatus);
}

//===================================================================

function requireNonNegativeNumber(
  value: unknown,
  label: string,
  payload: unknown
): number {
  const number = getFiniteNumber(value);

  if (number === undefined || number < 0) {
    invalidProductContract(
      `${label} must be a finite non-negative number.`,
      payload
    );
  }

  return number;
}

//===================================================================

function requireNonNegativeInteger(
  value: unknown,
  label: string,
  payload: unknown
): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    invalidProductContract(
      `${label} must be a safe non-negative integer.`,
      payload
    );
  }

  return value;
}

//===================================================================

function getProductOffer(
  product: ProductDetails,
  pharmacyId?: EntityId
): ProductDetails['offers'][number] {
  const offer = pharmacyId
    ? product.offers.find((item) => item.pharmacyId === pharmacyId)
    : product.offers[0];

  if (!offer) {
    invalidProductContract(
      'pharmacy product must contain the current pharmacy offer.',
      product
    );
  }

  return offer;
}

//===================================================================

function projectPharmacyProduct(
  product: ProductDetails,
  pharmacyId?: EntityId
): PharmacyProductRow {
  const offer = getProductOffer(product, pharmacyId);
  const name = getTrimmedString(product.name);
  const article = getTrimmedString(product.article);

  if (!isValidObjectId(product.id)) {
    invalidProductContract('pharmacy product.id is invalid.', product);
  }

  if (!name || !article) {
    invalidProductContract(
      'pharmacy product name and article must be non-empty strings.',
      product
    );
  }

  if (!isProductCategory(product.category)) {
    invalidProductContract('pharmacy product.category is invalid.', product);
  }

  if (!isOwnProductStatus(product.status)) {
    invalidProductContract('pharmacy product.status is invalid.', product);
  }

  if (!isValidObjectId(offer.id) || !isValidObjectId(offer.pharmacyId)) {
    invalidProductContract('pharmacy product offer IDs are invalid.', product);
  }

  if (pharmacyId && offer.pharmacyId !== pharmacyId) {
    invalidProductContract(
      'pharmacy product offer does not belong to the requested pharmacy.',
      product
    );
  }

  if (!isISODateTimeString(offer.createdAt)) {
    invalidProductContract(
      'pharmacy product offer.createdAt must be a canonical ISO datetime.',
      product
    );
  }

  const stockQuantity = requireNonNegativeInteger(
    offer.totalQuantity,
    'pharmacy product offer.totalQuantity',
    product
  );

  const reservedQuantity = requireNonNegativeInteger(
    offer.reservedQuantity,
    'pharmacy product offer.reservedQuantity',
    product
  );

  const availableQuantity = requireNonNegativeInteger(
    offer.availableQuantity,
    'pharmacy product offer.availableQuantity',
    product
  );

  if (availableQuantity + reservedQuantity !== stockQuantity) {
    invalidProductContract(
      'pharmacy product stock quantities are inconsistent.',
      product
    );
  }

  return {
    id: product.id,
    addedAt: offer.createdAt,
    article,
    name,
    category: product.category,
    stockQuantity,
    reservedQuantity,
    availableQuantity,
    currentPrice: requireNonNegativeNumber(
      offer.price,
      'pharmacy product offer.price',
      product
    ),
    ...(getTrimmedString(product.imageUrl)
      ? { imageUrl: getTrimmedString(product.imageUrl) }
      : {}),
    status: product.status,
    hasRelatedOrders: offer.hasRelatedOrders === true,
  };
}

//===================================================================

export function normalizePharmacyProduct(
  rawProduct: unknown,
  pharmacyId?: EntityId
): PharmacyProductRow {
  return projectPharmacyProduct(parseProductDetails(rawProduct), pharmacyId);
}

//===================================================================

function normalizeStatisticValue(
  value: unknown,
  label: string,
  amountRequired: boolean
): { quantity: number; amount?: number } {
  if (!isRecord(value)) {
    invalidProductContract(`${label} must be an object.`, value);
  }

  const quantity = requireNonNegativeInteger(
    value.quantity,
    `${label}.quantity`,
    value
  );

  if (!amountRequired) {
    if (value.amount !== undefined) {
      return {
        quantity,
        amount: requireNonNegativeNumber(
          value.amount,
          `${label}.amount`,
          value
        ),
      };
    }

    return { quantity };
  }

  return {
    quantity,
    amount: requireNonNegativeNumber(value.amount, `${label}.amount`, value),
  };
}

//===================================================================

function normalizeOwnProductStatistics(
  value: unknown
): OwnProductStatisticsCounts {
  if (!isRecord(value)) {
    invalidProductContract('own product statistics must be an object.', value);
  }

  return {
    inStock: normalizeStatisticValue(value.inStock, 'statistics.inStock', true),
    reserved: normalizeStatisticValue(
      value.reserved,
      'statistics.reserved',
      true
    ),
    available: normalizeStatisticValue(
      value.available,
      'statistics.available',
      true
    ),
    outOfStock: normalizeStatisticValue(
      value.outOfStock,
      'statistics.outOfStock',
      false
    ),
  };
}

//===================================================================

export function normalizePharmacyProductsResponse(
  payload: unknown,
  pharmacyId?: EntityId
): PharmacyProductsResponse {
  const response = parseProductsWithOffersResponse(payload);

  if (
    response.earliestCreatedAt !== null &&
    !isCalendarDateString(response.earliestCreatedAt)
  ) {
    invalidProductContract(
      'pharmacy products response.earliestCreatedAt must be a calendar date or null.',
      payload
    );
  }

  if (!isRecord(payload)) {
    invalidProductContract(
      'pharmacy products response must be an object.',
      payload
    );
  }

  return {
    ...response,
    items: response.items.map((product) =>
      projectPharmacyProduct(product, pharmacyId)
    ),
    statistics: normalizeOwnProductStatistics(payload.ownProductStatistics),
    earliestCreatedAt: response.earliestCreatedAt,
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
