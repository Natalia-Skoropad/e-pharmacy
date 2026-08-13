import type {
  FavoriteIdsResponse,
  FavoriteMutationResponse,
} from '@e-pharmacy/types/api';

import type {
  ActiveSession,
  ActiveSessionsResponse,
} from '@e-pharmacy/types/auth';

import type {
  Cart,
  CartIssue,
  CartItem,
  CartResponse,
} from '@e-pharmacy/types/cart';

// Kept backend/config-aligned by check-config-contracts.mjs; api-client must not depend on config.
const CART_ITEM_MAX_QUANTITY = 99;

import type {
  CheckoutOrderResponse,
  ClientOrder,
  ClientOrderDetailsResponse,
  ClientOrdersResponse,
  OrderManagerCommentsResponse,
} from '@e-pharmacy/types/orders';

import type {
  PharmaciesResponse,
  PharmacyCardSummary,
  PharmacyCheckoutDetails,
  PharmacyCheckoutDetailsResponse,
  PharmacyDetailsResponse,
  PharmacyDocumentContentResponse,
  PharmacyFilterOptionsResponse,
  PharmacyOption,
  PharmacyOptionsResponse,
  PharmacyProfile,
  PharmacyProfileResponse,
  PharmacyProfileDocumentUploadResponse,
  PharmacyRegistrationDocumentUploadResponse,
  PharmacyVerificationDocument,
  PublicPharmacy,
  SendPharmacyForVerificationResponse,
} from '@e-pharmacy/types/pharmacies';

import type {
  PharmacyProductMutationResponse,
  ProductCardSummary,
  ProductDetails,
  ProductDetailsResponse,
  ProductFilterOptionsResponse,
  ProductStockMovement,
  ProductStockMovementsResponse,
  ProductsResponse,
  ProductsWithOffersResponse,
} from '@e-pharmacy/types/products';

import type {
  Review,
  ReviewMutationResponse,
  ReviewsResponse,
} from '@e-pharmacy/types/reviews';

import { ApiError } from '../transport/api-error';
import type { ApiResponseContext } from './api-envelope';

import {
  normalizePaginatedResponse,
  requirePaginatedResponse,
} from './pagination';

//===================================================================

type UnknownRecord = Record<string, unknown>;
type FieldKind = 'string' | 'number' | 'boolean' | 'array' | 'record';

//===================================================================

function invalidDto(
  message: string,
  value: unknown,
  context: ApiResponseContext = {}
): ApiError {
  return new ApiError(message, {
    transportCode: 'INVALID_RESPONSE',
    payload: value,
    ...context,
  });
}

//===================================================================

function isRecord(value: unknown): value is UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

//===================================================================

function requireRecord(
  value: unknown,
  label: string,
  context?: ApiResponseContext
): UnknownRecord {
  if (!isRecord(value)) {
    throw invalidDto(`${label} must be an object.`, value, context);
  }

  return value;
}

//===================================================================

function hasKind(value: unknown, kind: FieldKind): boolean {
  if (kind === 'array') return Array.isArray(value);
  if (kind === 'record') return isRecord(value);
  return typeof value === kind && (kind !== 'number' || Number.isFinite(value));
}

//===================================================================

function requireFields(
  record: UnknownRecord,
  label: string,
  fields: Readonly<Record<string, FieldKind>>,
  context?: ApiResponseContext
): void {
  for (const [key, kind] of Object.entries(fields)) {
    if (!hasKind(record[key], kind)) {
      throw invalidDto(`${label}.${key} must be ${kind}.`, record, context);
    }
  }
}

//===================================================================

function requireOptionalFields(
  record: UnknownRecord,
  label: string,
  fields: Readonly<Record<string, FieldKind>>,
  context?: ApiResponseContext
): void {
  for (const [key, kind] of Object.entries(fields)) {
    if (record[key] !== undefined && !hasKind(record[key], kind)) {
      throw invalidDto(
        `${label}.${key} must be ${kind} when present.`,
        record,
        context
      );
    }
  }
}

//===================================================================

function requireNullableString(
  record: UnknownRecord,
  key: string,
  label: string,
  context?: ApiResponseContext
): string | null {
  const value = record[key];
  if (value !== null && typeof value !== 'string') {
    throw invalidDto(
      `${label}.${key} must be a string or null.`,
      record,
      context
    );
  }

  return value;
}

//===================================================================

function rejectFields(
  record: UnknownRecord,
  keys: readonly string[],
  label: string,
  context?: ApiResponseContext
): void {
  const forbiddenKey = keys.find((key) => record[key] !== undefined);

  if (forbiddenKey) {
    throw invalidDto(
      `${label}.${forbiddenKey} is not allowed in this response.`,
      record,
      context
    );
  }
}

//===================================================================

function requireNullableNonNegativeNumber(
  record: UnknownRecord,
  key: string,
  label: string,
  context?: ApiResponseContext
): number | null {
  const value = record[key];

  if (value === null) return null;

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw invalidDto(
      `${label}.${key} must be a non-negative number or null.`,
      record,
      context
    );
  }

  return value;
}

//===================================================================

function parseArray<TItem>(
  value: unknown,
  label: string,
  parser: (item: unknown, context?: ApiResponseContext) => TItem,
  context?: ApiResponseContext
): readonly TItem[] {
  if (!Array.isArray(value)) {
    throw invalidDto(`${label} must be an array.`, value, context);
  }

  return value.map((item, index) =>
    parser(item, {
      ...context,
      method: context?.method,
      url: context?.url ? `${context.url}#${label}[${index}]` : undefined,
    })
  );
}

//===================================================================

function checked<TValue>(value: unknown): TValue {
  return value as TValue;
}

//===================================================================

function requireSafeNonNegativeInteger(
  record: UnknownRecord,
  key: string,
  label: string,
  context?: ApiResponseContext
): number {
  const value = record[key];

  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw invalidDto(
      `${label}.${key} must be a safe non-negative integer.`,
      record,
      context
    );
  }

  return value;
}

//===================================================================

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const PRODUCT_CATEGORIES = new Set([
  'medicine',
  'vitamins',
  'beauty',
  'hygiene',
  'medical_devices',
  'other',
]);

const CART_ISSUE_REASONS = new Set([
  'expired',
  'offer_unavailable',
  'product_unavailable',
  'pharmacy_unavailable',
]);

const PHARMACY_STATUSES = new Set([
  'new',
  'on_verification',
  'on_moderation',
  'active',
  'blocked',
]);

// Mirrors the shared pharmacy verification-document contract. The config parity
// checks protect the source-of-truth value without coupling api-client to config.
const PHARMACY_DOCUMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

const PHARMACY_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const SHA256_PATTERN = /^[a-f\d]{64}$/i;
const PROFILE_PHARMACY_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 '’&().,/\-]*$/;
const PROFILE_ADDRESS_PATTERN = /^[A-Za-z0-9 .,'’/#&()\-]+$/;
const PROFILE_SEARCH_TEXT_PATTERN = /^[\p{L}\p{N} .,'’/#&()\-]*$/u;
const PROFILE_TEXT_EDITOR_PATTERN = /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*\n\r]+$/;
const PROFILE_BANK_TEXT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 '’&().,/\-]*$/;
const PROFILE_PAYMENT_PURPOSE_PATTERN = /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*]+$/;

const PROFILE_EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

const PROFILE_PHONE_PATTERN = /^\+380\d{9}$/;
const PROFILE_TAX_ID_PATTERN = /^\d{8,10}$/;
const PROFILE_IBAN_PATTERN = /^UA\d{27}$/;

const PROFILE_WORKING_HOURS_PATTERN =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(?:Closed|(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d)(?:;\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(?:Closed|(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d))*$/;

const PROFILE_PICTURE_DATA_URL_PATTERN =
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

//===================================================================

function requireObjectId(
  record: UnknownRecord,
  key: string,
  label: string,
  context?: ApiResponseContext
): string {
  const value = record[key];

  if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
    throw invalidDto(
      `${label}.${key} must be a Mongo ObjectId string.`,
      record,
      context
    );
  }

  return value;
}

//===================================================================

function requireCanonicalIsoDateTime(
  record: UnknownRecord,
  key: string,
  label: string,
  context?: ApiResponseContext
): string {
  const value = record[key];

  if (typeof value !== 'string') {
    throw invalidDto(
      `${label}.${key} must be an ISO datetime string.`,
      record,
      context
    );
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw invalidDto(
      `${label}.${key} must be a canonical ISO datetime string.`,
      record,
      context
    );
  }

  return value;
}

//===================================================================

function requireNonNegativeFiniteNumber(
  record: UnknownRecord,
  key: string,
  label: string,
  context?: ApiResponseContext
): number {
  const value = record[key];

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw invalidDto(
      `${label}.${key} must be a finite non-negative number.`,
      record,
      context
    );
  }

  return value;
}

//===================================================================

function requireSafePositiveInteger(
  record: UnknownRecord,
  key: string,
  label: string,
  context?: ApiResponseContext
): number {
  const value = record[key];

  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > CART_ITEM_MAX_QUANTITY
  ) {
    throw invalidDto(
      `${label}.${key} must be an integer from 1 to ${CART_ITEM_MAX_QUANTITY}.`,
      record,
      context
    );
  }

  return value;
}

//===================================================================

function assertMoneyEqual(
  actual: number,
  expected: number,
  message: string,
  value: unknown,
  context?: ApiResponseContext
): void {
  if (Math.abs(actual - expected) > 1e-9) {
    throw invalidDto(message, value, context);
  }
}

//===================================================================
function parseProductOffer(
  value: unknown,
  context?: ApiResponseContext
): ProductDetails['offers'][number] {
  const record = requireRecord(value, 'product offer', context);

  requireFields(
    record,
    'product offer',
    {
      id: 'string',
      pharmacyId: 'string',
      pharmacyName: 'string',
      pharmacyRating: 'number',
      pharmacyReviewsCount: 'number',
      pharmacyIsFavorite: 'boolean',
      price: 'number',
      totalQuantity: 'number',
      availableQuantity: 'number',
      reservedQuantity: 'number',
      inStock: 'boolean',
      createdAt: 'string',
      updatedAt: 'string',
    },
    context
  );

  requireOptionalFields(
    record,
    'product offer',
    {
      pharmacyCity: 'string',
      pharmacyAddress: 'string',
      pharmacyPhone: 'string',
      pharmacyImageUrl: 'string',
      hasRelatedOrders: 'boolean',
    },
    context
  );

  requireSafeNonNegativeInteger(
    record,
    'pharmacyReviewsCount',
    'product offer',
    context
  );

  const totalQuantity = requireSafeNonNegativeInteger(
    record,
    'totalQuantity',
    'product offer',
    context
  );

  const availableQuantity = requireSafeNonNegativeInteger(
    record,
    'availableQuantity',
    'product offer',
    context
  );

  const reservedQuantity = requireSafeNonNegativeInteger(
    record,
    'reservedQuantity',
    'product offer',
    context
  );

  if (availableQuantity > totalQuantity) {
    throw invalidDto(
      'product offer.availableQuantity must not exceed totalQuantity.',
      record,
      context
    );
  }

  if (reservedQuantity > totalQuantity) {
    throw invalidDto(
      'product offer.reservedQuantity must not exceed totalQuantity.',
      record,
      context
    );
  }

  if (availableQuantity + reservedQuantity > totalQuantity) {
    throw invalidDto(
      'product offer available and reserved quantities exceed totalQuantity.',
      record,
      context
    );
  }

  const expectedInStock = availableQuantity > 0;
  if (record.inStock !== expectedInStock) {
    throw invalidDto(
      'product offer.inStock must equal availableQuantity > 0.',
      record,
      context
    );
  }

  return checked<ProductDetails['offers'][number]>(record);
}

//===================================================================

export function parseProductCardSummary(
  value: unknown,
  context?: ApiResponseContext
): ProductCardSummary {
  const record = requireRecord(value, 'product card summary', context);

  requireFields(
    record,
    'product card summary',
    {
      id: 'string',
      name: 'string',
      publicSlugId: 'string',
      article: 'string',
      category: 'string',
      status: 'string',
      price: 'number',
      foundInPharmaciesCount: 'number',
      availableInPharmaciesCount: 'number',
      inStock: 'boolean',
      rating: 'number',
      reviewsCount: 'number',
      isFavorite: 'boolean',
      createdAt: 'string',
      updatedAt: 'string',
    },
    context
  );

  requireOptionalFields(
    record,
    'product card summary',
    {
      imageUrl: 'string',
      manufacturer: 'string',
    },
    context
  );

  const minPrice = requireNullableNonNegativeNumber(
    record,
    'minPrice',
    'product card summary',
    context
  );

  const maxPrice = requireNullableNonNegativeNumber(
    record,
    'maxPrice',
    'product card summary',
    context
  );

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    throw invalidDto(
      'product card summary.minPrice must not exceed maxPrice.',
      record,
      context
    );
  }

  requireSafeNonNegativeInteger(
    record,
    'foundInPharmaciesCount',
    'product card summary',
    context
  );

  requireSafeNonNegativeInteger(
    record,
    'availableInPharmaciesCount',
    'product card summary',
    context
  );

  requireSafeNonNegativeInteger(
    record,
    'reviewsCount',
    'product card summary',
    context
  );

  rejectFields(
    record,
    [
      'offers',
      'description',
      'dosage',
      'packageQuantity',
      'pharmacyId',
      'pharmacyName',
    ],
    'product card summary',
    context
  );

  return checked<ProductCardSummary>(record);
}

//===================================================================
export function parseProductDetails(
  value: unknown,
  context?: ApiResponseContext
): ProductDetails {
  const record = requireRecord(value, 'product', context);
  requireFields(
    record,
    'product',
    {
      id: 'string',
      name: 'string',
      publicSlugId: 'string',
      article: 'string',
      category: 'string',
      status: 'string',
      price: 'number',
      foundInPharmaciesCount: 'number',
      availableInPharmaciesCount: 'number',
      inStock: 'boolean',
      rating: 'number',
      reviewsCount: 'number',
      isFavorite: 'boolean',
      createdAt: 'string',
      updatedAt: 'string',
      offers: 'array',
    },
    context
  );

  requireSafeNonNegativeInteger(
    record,
    'foundInPharmaciesCount',
    'product',
    context
  );

  requireSafeNonNegativeInteger(
    record,
    'availableInPharmaciesCount',
    'product',
    context
  );

  requireSafeNonNegativeInteger(record, 'reviewsCount', 'product', context);

  requireOptionalFields(
    record,
    'product',
    {
      slug: 'string',
      imageUrl: 'string',
      manufacturer: 'string',
      dosage: 'string',
      packageQuantity: 'string',
      description: 'string',
      pharmacyId: 'string',
      pharmacyName: 'string',
    },
    context
  );

  return checked<ProductDetails>({
    ...record,
    offers: parseArray(record.offers, 'offers', parseProductOffer, context),
  });
}

//===================================================================

export function parseProductsResponse(
  value: unknown,
  context?: ApiResponseContext
): ProductsResponse {
  const record = requireRecord(value, 'products response', context);
  const pagination = requirePaginatedResponse(
    normalizePaginatedResponse(record, {
      normalizeItem: (item) => parseProductCardSummary(item, context),
    }),
    { label: 'products response', ...context }
  );

  const earliestCreatedAt = requireNullableString(
    record,
    'earliestCreatedAt',
    'products response',
    context
  );

  return checked<ProductsResponse>({ ...pagination, earliestCreatedAt });
}

//===================================================================

export function parseProductsWithOffersResponse(
  value: unknown,
  context?: ApiResponseContext
): ProductsWithOffersResponse {
  const record = requireRecord(value, 'products with offers response', context);
  const pagination = requirePaginatedResponse(
    normalizePaginatedResponse(record, {
      normalizeItem: (item) => parseProductDetails(item, context),
    }),
    { label: 'products with offers response', ...context }
  );

  const earliestCreatedAt = requireNullableString(
    record,
    'earliestCreatedAt',
    'products with offers response',
    context
  );

  return checked<ProductsWithOffersResponse>({
    ...pagination,
    earliestCreatedAt,
  });
}

//===================================================================

export function parseProductDetailsResponse(
  value: unknown,
  context?: ApiResponseContext
): ProductDetailsResponse {
  const record = requireRecord(value, 'product details response', context);
  return { product: parseProductDetails(record.product, context) };
}

//===================================================================

export function parsePharmacyProductMutationResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmacyProductMutationResponse {
  const record = requireRecord(value, 'product mutation response', context);
  requireFields(
    record,
    'product mutation response',
    { message: 'string' },
    context
  );

  return checked<PharmacyProductMutationResponse>({
    product: parseProductDetails(record.product, context),
    message: record.message,
  });
}

//===================================================================

function parseFilterOption(value: unknown, context?: ApiResponseContext) {
  const record = requireRecord(value, 'filter option', context);
  requireFields(
    record,
    'filter option',
    { value: 'string', label: 'string' },
    context
  );

  return { value: record.value, label: record.label };
}

//===================================================================

export function parseProductFilterOptionsResponse(
  value: unknown,
  context?: ApiResponseContext
): ProductFilterOptionsResponse {
  const record = requireRecord(
    value,
    'product filter options response',
    context
  );
  return checked<ProductFilterOptionsResponse>({
    categories: parseArray(
      record.categories,
      'categories',
      parseFilterOption,
      context
    ),

    availability: parseArray(
      record.availability,
      'availability',
      parseFilterOption,
      context
    ),

    sort: parseArray(record.sort, 'sort', parseFilterOption, context),
  });
}

//===================================================================

function parseProductStockMovement(
  value: unknown,
  context?: ApiResponseContext
): ProductStockMovement {
  const record = requireRecord(value, 'stock movement', context);
  requireFields(
    record,
    'stock movement',
    {
      id: 'string',
      sequence: 'number',
      occurredAt: 'string',
      eventType: 'string',
      source: 'string',
      quantity: 'number',
      stockDelta: 'number',
      reservedDelta: 'number',
      availableDelta: 'number',
      balanceAfter: 'record',
      unitPrice: 'number',
      movementValue: 'number',
      comment: 'string',
    },

    context
  );

  return checked<ProductStockMovement>(record);
}

//===================================================================

export function parseProductStockMovementsResponse(
  value: unknown,
  context?: ApiResponseContext
): ProductStockMovementsResponse {
  const record = requireRecord(value, 'stock movements response', context);

  const pagination = requirePaginatedResponse(
    normalizePaginatedResponse(record, {
      normalizeItem: (item) => {
        try {
          return parseProductStockMovement(item, context);
        } catch {
          return null;
        }
      },
    }),
    { label: 'stock movements response', ...context }
  );

  const stock = requireRecord(record.stock, 'stock balance', context);

  requireFields(
    stock,
    'stock balance',
    {
      stockQuantity: 'number',
      reservedQuantity: 'number',
      availableQuantity: 'number',
    },
    context
  );

  const earliestCreatedAt = requireNullableString(
    record,
    'earliestCreatedAt',
    'stock movements response',
    context
  );

  return checked<ProductStockMovementsResponse>({
    ...pagination,
    stock,
    earliestCreatedAt,
  });
}

//===================================================================

export function parsePharmacyCardSummary(
  value: unknown,
  context?: ApiResponseContext
): PharmacyCardSummary {
  const record = requireRecord(value, 'pharmacy card summary', context);

  requireFields(
    record,
    'pharmacy card summary',
    {
      id: 'string',
      name: 'string',
      publicSlugId: 'string',
      rating: 'number',
      availableProductsCount: 'number',
      reviewsCount: 'number',
      isFavorite: 'boolean',
    },
    context
  );

  requireOptionalFields(
    record,
    'pharmacy card summary',
    {
      address: 'string',
      city: 'string',
      phone: 'string',
      imageUrl: 'string',
    },
    context
  );

  requireSafeNonNegativeInteger(
    record,
    'availableProductsCount',
    'pharmacy card summary',
    context
  );

  requireSafeNonNegativeInteger(
    record,
    'reviewsCount',
    'pharmacy card summary',
    context
  );

  rejectFields(
    record,
    [
      'email',
      'workingHours',
      'description',
      'updatedAt',
      'bankTransferAvailable',
      'bankDetails',
    ],
    'pharmacy card summary',
    context
  );

  return checked<PharmacyCardSummary>(record);
}

//===================================================================

function parsePublicPharmacy(
  value: unknown,
  context?: ApiResponseContext
): PublicPharmacy {
  const record = requireRecord(value, 'pharmacy', context);
  requireFields(
    record,
    'pharmacy',
    {
      id: 'string',
      name: 'string',
      publicSlugId: 'string',
      rating: 'number',
      availableProductsCount: 'number',
      reviewsCount: 'number',
      isFavorite: 'boolean',
      bankTransferAvailable: 'boolean',
      updatedAt: 'string',
    },
    context
  );

  requireOptionalFields(
    record,
    'pharmacy',
    {
      address: 'string',
      city: 'string',
      phone: 'string',
      email: 'string',
      workingHours: 'string',
      imageUrl: 'string',
      description: 'string',
      bankDetails: 'record',
    },
    context
  );

  requireSafeNonNegativeInteger(
    record,
    'availableProductsCount',
    'pharmacy',
    context
  );

  requireSafeNonNegativeInteger(record, 'reviewsCount', 'pharmacy', context);

  return checked<PublicPharmacy>(record);
}

//===================================================================

export function parsePharmaciesResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmaciesResponse {
  return requirePaginatedResponse(
    normalizePaginatedResponse(value, {
      normalizeItem: (item) => {
        try {
          return parsePharmacyCardSummary(item, context);
        } catch {
          return null;
        }
      },
    }),
    { label: 'pharmacies response', ...context }
  );
}

//===================================================================

function parsePharmacyOption(
  value: unknown,
  context?: ApiResponseContext
): PharmacyOption {
  const record = requireRecord(value, 'pharmacy option', context);

  requireFields(
    record,
    'pharmacy option',
    { id: 'string', name: 'string' },
    context
  );

  return checked<PharmacyOption>({ id: record.id, name: record.name });
}

//===================================================================

export function parsePharmacyOptionsResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmacyOptionsResponse {
  const record = requireRecord(value, 'pharmacy options response', context);

  return {
    items: parseArray(record.items, 'items', parsePharmacyOption, context),
  };
}

//===================================================================

export function parsePharmacyFilterOptionsResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmacyFilterOptionsResponse {
  const record = requireRecord(
    value,
    'pharmacy filter options response',
    context
  );

  return checked<PharmacyFilterOptionsResponse>({
    cities: parseArray(record.cities, 'cities', parseFilterOption, context),
    sort: parseArray(record.sort, 'sort', parseFilterOption, context),
  });
}

//===================================================================

export function parsePharmacyDetailsResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmacyDetailsResponse {
  const record = requireRecord(value, 'pharmacy details response', context);
  return { pharmacy: parsePublicPharmacy(record.pharmacy, context) };
}

//===================================================================

function parsePharmacyCheckoutDetails(
  value: unknown,
  context?: ApiResponseContext
): PharmacyCheckoutDetails {
  const record = requireRecord(value, 'pharmacy checkout details', context);
  requireFields(
    record,
    'pharmacy checkout details',
    {
      id: 'string',
      name: 'string',
      bankTransferAvailable: 'boolean',
    },
    context
  );

  return checked<PharmacyCheckoutDetails>(record);
}

//===================================================================

export function parsePharmacyCheckoutDetailsResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmacyCheckoutDetailsResponse {
  const record = requireRecord(
    value,
    'pharmacy checkout details response',
    context
  );

  return { pharmacy: parsePharmacyCheckoutDetails(record.pharmacy, context) };
}

//===================================================================

function parsePharmacyVerificationDocument(
  value: unknown,
  context?: ApiResponseContext
): PharmacyVerificationDocument {
  const record = requireRecord(
    value,
    'pharmacy verification document',
    context
  );

  const id = requireObjectId(
    record,
    'id',
    'pharmacy verification document',
    context
  );

  const uploadedAt = requireCanonicalIsoDateTime(
    record,
    'uploadedAt',
    'pharmacy verification document',
    context
  );

  const size = requireSafeNonNegativeInteger(
    record,
    'size',
    'pharmacy verification document',
    context
  );

  if (size < 1 || size > PHARMACY_DOCUMENT_MAX_SIZE_BYTES) {
    throw invalidDto(
      'pharmacy verification document.size is outside the allowed range.',
      record,
      context
    );
  }

  if (typeof record.name !== 'string' || !record.name.trim()) {
    throw invalidDto(
      'pharmacy verification document.name must be a non-empty string.',
      record,
      context
    );
  }

  if (
    typeof record.type !== 'string' ||
    !PHARMACY_DOCUMENT_MIME_TYPES.has(record.type)
  ) {
    throw invalidDto(
      'pharmacy verification document.type is invalid.',
      record,
      context
    );
  }

  if (
    typeof record.sha256 !== 'string' ||
    !SHA256_PATTERN.test(record.sha256)
  ) {
    throw invalidDto(
      'pharmacy verification document.sha256 is invalid.',
      record,
      context
    );
  }

  return {
    id,
    name: record.name,
    size,
    type: record.type,
    sha256: record.sha256,
    uploadedAt: checked<PharmacyVerificationDocument['uploadedAt']>(uploadedAt),
  };
}

//===================================================================

function parsePharmacyVerificationDocuments(
  value: unknown,
  label: string,
  context?: ApiResponseContext
): readonly PharmacyVerificationDocument[] {
  const documents = parseArray(
    value,
    label,
    parsePharmacyVerificationDocument,
    context
  );

  if (documents.length > 6) {
    throw invalidDto(
      `${label} must contain at most 6 documents.`,
      value,
      context
    );
  }

  if (
    new Set(documents.map((document) => document.id)).size !== documents.length
  ) {
    throw invalidDto(
      `${label} must not contain duplicate document IDs.`,
      value,
      context
    );
  }

  return documents;
}

//===================================================================

function isHttpPictureUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function hasCompleteWorkingHours(value: string): boolean {
  if (!PROFILE_WORKING_HOURS_PATTERN.test(value)) return false;

  const expectedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const actualDays = value.split('; ').map((entry) => entry.slice(0, 3));

  return (
    actualDays.length === expectedDays.length &&
    expectedDays.every((day, index) => actualDays[index] === day)
  );
}

//===================================================================

function validateProfileStringPattern(
  value: unknown,
  label: string,
  pattern: RegExp,
  record: UnknownRecord,
  context?: ApiResponseContext
): void {
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw invalidDto(`${label} is invalid.`, record, context);
  }
}

//===================================================================

function validateOptionalPharmacyProfileSemantics(
  record: UnknownRecord,
  context?: ApiResponseContext
): void {
  if (
    typeof record.name !== 'string' ||
    (record.name.length > 0 && !PROFILE_PHARMACY_NAME_PATTERN.test(record.name))
  ) {
    throw invalidDto('pharmacy profile.name is invalid.', record, context);
  }

  if (record.address !== undefined) {
    validateProfileStringPattern(
      record.address,
      'pharmacy profile.address',
      PROFILE_ADDRESS_PATTERN,
      record,
      context
    );
  }

  if (
    record.city !== undefined &&
    (typeof record.city !== 'string' ||
      !PROFILE_SEARCH_TEXT_PATTERN.test(record.city))
  ) {
    throw invalidDto('pharmacy profile.city is invalid.', record, context);
  }

  if (
    record.description !== undefined &&
    (typeof record.description !== 'string' ||
      !PROFILE_TEXT_EDITOR_PATTERN.test(record.description))
  ) {
    throw invalidDto(
      'pharmacy profile.description is invalid.',
      record,
      context
    );
  }

  if (record.email !== undefined) {
    validateProfileStringPattern(
      record.email,
      'pharmacy profile.email',
      PROFILE_EMAIL_PATTERN,
      record,
      context
    );
  }

  if (record.phone !== undefined) {
    validateProfileStringPattern(
      record.phone,
      'pharmacy profile.phone',
      PROFILE_PHONE_PATTERN,
      record,
      context
    );
  }

  if (
    record.workingHours !== undefined &&
    (typeof record.workingHours !== 'string' ||
      !hasCompleteWorkingHours(record.workingHours))
  ) {
    throw invalidDto(
      'pharmacy profile.workingHours is invalid.',
      record,
      context
    );
  }

  if (
    record.imageUrl !== undefined &&
    (typeof record.imageUrl !== 'string' ||
      (!PROFILE_PICTURE_DATA_URL_PATTERN.test(record.imageUrl) &&
        !isHttpPictureUrl(record.imageUrl)))
  ) {
    throw invalidDto('pharmacy profile.imageUrl is invalid.', record, context);
  }
}

//===================================================================

function parseEditablePharmacyBankDetails(
  value: unknown,
  context?: ApiResponseContext
): PharmacyProfile['bankDetails'] {
  if (value === undefined) return undefined;
  const record = requireRecord(value, 'pharmacy bank details', context);
  const result: Record<string, string> = {};

  for (const key of [
    'recipientName',
    'taxId',
    'iban',
    'bankName',
    'receiptEmail',
    'paymentPurpose',
  ] as const) {
    const fieldValue = record[key];
    if (fieldValue === undefined) continue;
    if (typeof fieldValue !== 'string') {
      throw invalidDto(
        `pharmacy bank details.${key} must be a string when present.`,
        record,
        context
      );
    }
    result[key] = fieldValue;
  }

  for (const key of ['recipientName', 'bankName'] as const) {
    const value = result[key];
    if (value !== undefined && !PROFILE_BANK_TEXT_PATTERN.test(value)) {
      throw invalidDto(
        `pharmacy bank details.${key} is invalid.`,
        record,
        context
      );
    }
  }
  if (
    result.paymentPurpose !== undefined &&
    !PROFILE_PAYMENT_PURPOSE_PATTERN.test(result.paymentPurpose)
  ) {
    throw invalidDto(
      'pharmacy bank details.paymentPurpose is invalid.',
      record,
      context
    );
  }

  if (
    result.taxId !== undefined &&
    !PROFILE_TAX_ID_PATTERN.test(result.taxId)
  ) {
    throw invalidDto(
      'pharmacy bank details.taxId is invalid.',
      record,
      context
    );
  }
  if (result.iban !== undefined && !PROFILE_IBAN_PATTERN.test(result.iban)) {
    throw invalidDto('pharmacy bank details.iban is invalid.', record, context);
  }
  if (
    result.receiptEmail !== undefined &&
    !PROFILE_EMAIL_PATTERN.test(result.receiptEmail)
  ) {
    throw invalidDto(
      'pharmacy bank details.receiptEmail is invalid.',
      record,
      context
    );
  }

  return checked<NonNullable<PharmacyProfile['bankDetails']>>(result);
}

//===================================================================

function parsePharmacyPendingModeration(
  value: unknown,
  context?: ApiResponseContext
): PharmacyProfile['pendingModeration'] {
  if (value === undefined) return undefined;
  const record = requireRecord(value, 'pharmacy pending moderation', context);
  const result: Record<string, unknown> = {};

  for (const key of [
    'name',
    'address',
    'city',
    'phone',
    'email',
    'workingHours',
    'description',
  ] as const) {
    const fieldValue = record[key];
    if (fieldValue === undefined) continue;
    if (typeof fieldValue !== 'string') {
      throw invalidDto(
        `pharmacy pending moderation.${key} must be a string when present.`,
        record,
        context
      );
    }
    result[key] = fieldValue;
  }

  if (
    record.name !== undefined &&
    (typeof record.name !== 'string' ||
      (record.name.length > 0 &&
        !PROFILE_PHARMACY_NAME_PATTERN.test(record.name)))
  ) {
    throw invalidDto(
      'pharmacy pending moderation.name is invalid.',
      record,
      context
    );
  }
  if (record.address !== undefined) {
    validateProfileStringPattern(
      record.address,
      'pharmacy pending moderation.address',
      PROFILE_ADDRESS_PATTERN,
      record,
      context
    );
  }
  if (
    record.city !== undefined &&
    (typeof record.city !== 'string' ||
      !PROFILE_SEARCH_TEXT_PATTERN.test(record.city))
  ) {
    throw invalidDto(
      'pharmacy pending moderation.city is invalid.',
      record,
      context
    );
  }
  if (
    record.description !== undefined &&
    (typeof record.description !== 'string' ||
      !PROFILE_TEXT_EDITOR_PATTERN.test(record.description))
  ) {
    throw invalidDto(
      'pharmacy pending moderation.description is invalid.',
      record,
      context
    );
  }

  if (record.email !== undefined) {
    validateProfileStringPattern(
      record.email,
      'pharmacy pending moderation.email',
      PROFILE_EMAIL_PATTERN,
      record,
      context
    );
  }
  if (record.phone !== undefined) {
    validateProfileStringPattern(
      record.phone,
      'pharmacy pending moderation.phone',
      PROFILE_PHONE_PATTERN,
      record,
      context
    );
  }
  if (
    record.workingHours !== undefined &&
    (typeof record.workingHours !== 'string' ||
      !hasCompleteWorkingHours(record.workingHours))
  ) {
    throw invalidDto(
      'pharmacy pending moderation.workingHours is invalid.',
      record,
      context
    );
  }

  if (record.imageUrl !== undefined) {
    if (record.imageUrl !== null && typeof record.imageUrl !== 'string') {
      throw invalidDto(
        'pharmacy pending moderation.imageUrl must be a string or null.',
        record,
        context
      );
    }
    if (
      typeof record.imageUrl === 'string' &&
      !PROFILE_PICTURE_DATA_URL_PATTERN.test(record.imageUrl) &&
      !isHttpPictureUrl(record.imageUrl)
    ) {
      throw invalidDto(
        'pharmacy pending moderation.imageUrl is invalid.',
        record,
        context
      );
    }
    result.imageUrl = record.imageUrl;
  }

  if (record.documents !== undefined) {
    result.documents = parsePharmacyVerificationDocuments(
      record.documents,
      'pharmacy pending moderation.documents',
      context
    );
  }

  if (record.bankDetails !== undefined) {
    result.bankDetails = parseEditablePharmacyBankDetails(
      record.bankDetails,
      context
    );
  }

  return checked<NonNullable<PharmacyProfile['pendingModeration']>>(result);
}

//===================================================================

function parsePharmacyProfile(
  value: unknown,
  context?: ApiResponseContext
): PharmacyProfile {
  const record = requireRecord(value, 'pharmacy profile', context);
  const id = requireObjectId(record, 'id', 'pharmacy profile', context);
  const updatedAt = requireCanonicalIsoDateTime(
    record,
    'updatedAt',
    'pharmacy profile',
    context
  );

  requireFields(
    record,
    'pharmacy profile',
    {
      name: 'string',
      bankTransferAvailable: 'boolean',
      documents: 'array',
      status: 'string',
      rating: 'number',
      reviewsCount: 'number',
    },
    context
  );

  requireOptionalFields(
    record,
    'pharmacy profile',
    {
      address: 'string',
      city: 'string',
      phone: 'string',
      email: 'string',
      workingHours: 'string',
      imageUrl: 'string',
      description: 'string',
      statusReason: 'string',
    },
    context
  );

  validateOptionalPharmacyProfileSemantics(record, context);

  if (!PHARMACY_STATUSES.has(record.status as string)) {
    throw invalidDto('pharmacy profile.status is invalid.', record, context);
  }

  const rating = requireNonNegativeFiniteNumber(
    record,
    'rating',
    'pharmacy profile',
    context
  );
  if (rating > 5) {
    throw invalidDto(
      'pharmacy profile.rating must not exceed 5.',
      record,
      context
    );
  }

  const reviewsCount = requireSafeNonNegativeInteger(
    record,
    'reviewsCount',
    'pharmacy profile',
    context
  );

  return {
    id,
    name: record.name as string,
    ...(record.address !== undefined
      ? { address: record.address as string }
      : {}),
    ...(record.city !== undefined ? { city: record.city as string } : {}),
    ...(record.phone !== undefined ? { phone: record.phone as string } : {}),
    ...(record.email !== undefined ? { email: record.email as string } : {}),
    ...(record.workingHours !== undefined
      ? { workingHours: record.workingHours as string }
      : {}),
    ...(record.bankDetails !== undefined
      ? {
          bankDetails: parseEditablePharmacyBankDetails(
            record.bankDetails,
            context
          ),
        }
      : {}),
    bankTransferAvailable: record.bankTransferAvailable as boolean,
    documents: parsePharmacyVerificationDocuments(
      record.documents,
      'pharmacy profile.documents',
      context
    ),
    status: checked<PharmacyProfile['status']>(record.status),
    rating,
    ...(record.imageUrl !== undefined
      ? { imageUrl: record.imageUrl as string }
      : {}),
    ...(record.description !== undefined
      ? { description: record.description as string }
      : {}),
    ...(record.statusReason !== undefined
      ? { statusReason: record.statusReason as string }
      : {}),
    ...(record.pendingModeration !== undefined
      ? {
          pendingModeration: parsePharmacyPendingModeration(
            record.pendingModeration,
            context
          )!,
        }
      : {}),
    reviewsCount,
    updatedAt: checked<PharmacyProfile['updatedAt']>(updatedAt),
  };
}

//===================================================================

export function parsePharmacyRegistrationDocumentUploadResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmacyRegistrationDocumentUploadResponse {
  const record = requireRecord(
    value,
    'pharmacy registration document upload response',
    context
  );
  if (
    typeof record.claimToken !== 'string' ||
    !/^[a-f\d]{64}$/i.test(record.claimToken)
  ) {
    throw invalidDto(
      'pharmacy document claimToken is invalid.',
      record,
      context
    );
  }
  return {
    document: parsePharmacyVerificationDocument(record.document, context),
    claimToken: record.claimToken,
  };
}

//===================================================================

export function parsePharmacyDocumentContentResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmacyDocumentContentResponse {
  const record = requireRecord(
    value,
    'pharmacy document content response',
    context
  );
  const document = parsePharmacyVerificationDocument(record.document, context);

  if (
    typeof record.dataUrl !== 'string' ||
    !record.dataUrl.startsWith(`data:${document.type};base64,`) ||
    record.dataUrl.length <= `data:${document.type};base64,`.length
  ) {
    throw invalidDto('pharmacy document dataUrl is invalid.', record, context);
  }

  return { document, dataUrl: record.dataUrl };
}

//===================================================================

export function parsePharmacyProfileDocumentUploadResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmacyProfileDocumentUploadResponse {
  const record = requireRecord(
    value,
    'pharmacy profile document upload response',
    context
  );
  return {
    document: parsePharmacyVerificationDocument(record.document, context),
  };
}

//===================================================================

export function parsePharmacyProfileResponse(
  value: unknown,
  context?: ApiResponseContext
): PharmacyProfileResponse {
  const record = requireRecord(value, 'pharmacy profile response', context);
  return { pharmacy: parsePharmacyProfile(record.pharmacy, context) };
}

//===================================================================

export function parseSendPharmacyForVerificationResponse(
  value: unknown,
  context?: ApiResponseContext
): SendPharmacyForVerificationResponse {
  const record = requireRecord(
    value,
    'send pharmacy for verification response',
    context
  );

  requireFields(
    record,
    'send pharmacy for verification response',
    {
      message: 'string',
    },
    context
  );

  return checked<SendPharmacyForVerificationResponse>({
    pharmacy: parsePharmacyProfile(record.pharmacy, context),
    message: record.message,
  });
}

//===================================================================

function parseReview(value: unknown, context?: ApiResponseContext): Review {
  const record = requireRecord(value, 'review', context);
  requireFields(
    record,
    'review',
    {
      id: 'string',
      userName: 'string',
      rating: 'number',
      comment: 'string',
      createdAt: 'string',
    },
    context
  );

  return checked<Review>(record);
}

//===================================================================

export function parseReviewsResponse(
  value: unknown,
  context?: ApiResponseContext
): ReviewsResponse {
  const record = requireRecord(value, 'reviews response', context);
  requireFields(record, 'reviews response', { total: 'number' }, context);

  return checked<ReviewsResponse>({
    items: parseArray(record.items, 'items', parseReview, context),
    total: record.total,
  });
}

//===================================================================

export function parseReviewMutationResponse(
  value: unknown,
  context?: ApiResponseContext
): ReviewMutationResponse {
  const record = requireRecord(value, 'review mutation response', context);

  requireFields(
    record,
    'review mutation response',
    { message: 'string' },
    context
  );

  return checked<ReviewMutationResponse>({ message: record.message });
}

//===================================================================

export function parseFavoriteIdsResponse(
  value: unknown,
  context?: ApiResponseContext
): FavoriteIdsResponse {
  const record = requireRecord(value, 'favorite ids response', context);

  const ids = parseArray(
    record.ids,
    'ids',
    (id) => {
      if (typeof id !== 'string') {
        throw invalidDto('Favorite id must be a string.', id, context);
      }
      return id;
    },
    context
  );

  return { ids };
}

//===================================================================

export function parseFavoriteMutationResponse(
  value: unknown,
  context?: ApiResponseContext
): FavoriteMutationResponse {
  const record = requireRecord(value, 'favorite mutation response', context);

  requireFields(
    record,
    'favorite mutation response',
    {
      isFavorite: 'boolean',
      message: 'string',
    },
    context
  );

  return checked<FavoriteMutationResponse>({
    isFavorite: record.isFavorite,
    message: record.message,
  });
}

//===================================================================

export type MessageResponse = Readonly<{ message: string }>;

//===================================================================

export function parseMessageResponse(
  value: unknown,
  context?: ApiResponseContext
): MessageResponse {
  const record = requireRecord(value, 'message response', context);
  requireFields(record, 'message response', { message: 'string' }, context);
  return checked<MessageResponse>({ message: record.message });
}

//===================================================================

function parseCartProduct(
  value: unknown,
  context?: ApiResponseContext
): CartItem['product'] {
  const record = requireRecord(value, 'cart product', context);

  requireFields(
    record,
    'cart product',
    {
      id: 'string',
      name: 'string',
      article: 'string',
      category: 'string',
      price: 'number',
      inStock: 'boolean',
    },
    context
  );

  requireOptionalFields(
    record,
    'cart product',
    {
      imageUrl: 'string',
      pharmacyName: 'string',
      rating: 'number',
      reviewsCount: 'number',
    },
    context
  );

  requireObjectId(record, 'id', 'cart product', context);
  requireNonNegativeFiniteNumber(record, 'price', 'cart product', context);

  if (!PRODUCT_CATEGORIES.has(String(record.category))) {
    throw invalidDto(
      'cart product.category is not supported.',
      record,
      context
    );
  }

  if (record.rating !== undefined) {
    requireNonNegativeFiniteNumber(record, 'rating', 'cart product', context);
  }

  if (record.reviewsCount !== undefined) {
    requireSafeNonNegativeInteger(
      record,
      'reviewsCount',
      'cart product',
      context
    );
  }

  return checked<CartItem['product']>(record);
}

//===================================================================

function parseCartItem(value: unknown, context?: ApiResponseContext): CartItem {
  const record = requireRecord(value, 'cart item', context);
  requireFields(
    record,
    'cart item',
    {
      id: 'string',
      productOfferId: 'string',
      productId: 'string',
      pharmacyId: 'string',
      product: 'record',
      pharmacyName: 'string',
      stockQuantity: 'number',
      quantity: 'number',
      unitPrice: 'number',
      totalPrice: 'number',
      expiresAt: 'string',
    },
    context
  );

  requireOptionalFields(
    record,
    'cart item',
    {
      pharmacyRating: 'number',
      pharmacyReviewsCount: 'number',
    },
    context
  );

  const id = requireObjectId(record, 'id', 'cart item', context);

  const productOfferId = requireObjectId(
    record,
    'productOfferId',
    'cart item',
    context
  );

  const productId = requireObjectId(record, 'productId', 'cart item', context);

  const pharmacyId = requireObjectId(
    record,
    'pharmacyId',
    'cart item',
    context
  );

  const stockQuantity = requireSafeNonNegativeInteger(
    record,
    'stockQuantity',
    'cart item',
    context
  );

  const quantity = requireSafePositiveInteger(
    record,
    'quantity',
    'cart item',
    context
  );

  const unitPrice = requireNonNegativeFiniteNumber(
    record,
    'unitPrice',
    'cart item',
    context
  );

  const totalPrice = requireNonNegativeFiniteNumber(
    record,
    'totalPrice',
    'cart item',
    context
  );

  const expiresAt = requireCanonicalIsoDateTime(
    record,
    'expiresAt',
    'cart item',
    context
  );

  const product = parseCartProduct(record.product, context);

  if (product.id !== productId) {
    throw invalidDto(
      'cart item.product.id must equal productId.',
      record,
      context
    );
  }

  if (product.price !== unitPrice) {
    throw invalidDto(
      'cart item.product.price must equal unitPrice.',
      record,
      context
    );
  }

  if (
    product.pharmacyName !== undefined &&
    product.pharmacyName !== record.pharmacyName
  ) {
    throw invalidDto(
      'cart item.product.pharmacyName must equal pharmacyName when present.',
      record,
      context
    );
  }

  if (product.inStock !== stockQuantity > 0) {
    throw invalidDto(
      'cart item.product.inStock must equal stockQuantity > 0.',
      record,
      context
    );
  }

  if (record.pharmacyRating !== undefined) {
    requireNonNegativeFiniteNumber(
      record,
      'pharmacyRating',
      'cart item',
      context
    );
  }

  if (record.pharmacyReviewsCount !== undefined) {
    requireSafeNonNegativeInteger(
      record,
      'pharmacyReviewsCount',
      'cart item',
      context
    );
  }

  assertMoneyEqual(
    totalPrice,
    quantity * unitPrice,
    'cart item.totalPrice must equal quantity * unitPrice.',
    record,
    context
  );

  return checked<CartItem>({
    ...record,
    id,
    productOfferId,
    productId,
    pharmacyId,
    product,
    stockQuantity,
    quantity,
    unitPrice,
    totalPrice,
    expiresAt,
  });
}

//===================================================================

function assertCartPharmacyMetadataConsistency(
  items: readonly CartItem[],
  source: unknown,
  context?: ApiResponseContext
): void {
  const metadataByPharmacy = new Map<
    string,
    Readonly<{
      pharmacyName: string;
      pharmacyRating?: number;
      pharmacyReviewsCount?: number;
    }>
  >();

  for (const item of items) {
    const metadata = {
      pharmacyName: item.pharmacyName,
      ...(item.pharmacyRating !== undefined
        ? { pharmacyRating: item.pharmacyRating }
        : {}),
      ...(item.pharmacyReviewsCount !== undefined
        ? { pharmacyReviewsCount: item.pharmacyReviewsCount }
        : {}),
    };

    const existing = metadataByPharmacy.get(item.pharmacyId);
    if (!existing) {
      metadataByPharmacy.set(item.pharmacyId, metadata);
      continue;
    }

    if (
      existing.pharmacyName !== metadata.pharmacyName ||
      existing.pharmacyRating !== metadata.pharmacyRating ||
      existing.pharmacyReviewsCount !== metadata.pharmacyReviewsCount
    ) {
      throw invalidDto(
        'cart items for one pharmacy must share canonical pharmacy metadata.',
        source,
        context
      );
    }
  }
}

//===================================================================

function parseCartIssue(
  value: unknown,
  context?: ApiResponseContext
): CartIssue {
  const record = requireRecord(value, 'cart issue', context);
  requireFields(
    record,
    'cart issue',
    { cartItemId: 'string', reason: 'string' },
    context
  );

  const cartItemId = requireObjectId(
    record,
    'cartItemId',
    'cart issue',
    context
  );

  if (!CART_ISSUE_REASONS.has(String(record.reason))) {
    throw invalidDto('cart issue.reason is not supported.', record, context);
  }

  return checked<CartIssue>({ cartItemId, reason: record.reason });
}

//===================================================================

function parseCart(value: unknown, context?: ApiResponseContext): Cart {
  const record = requireRecord(value, 'cart', context);

  requireFields(
    record,
    'cart',
    {
      revision: 'number',
      items: 'array',
      totalItems: 'number',
      totalPrice: 'number',
      issues: 'array',
    },
    context
  );

  const revision = requireSafeNonNegativeInteger(
    record,
    'revision',
    'cart',
    context
  );

  const items = parseArray(record.items, 'items', parseCartItem, context);
  assertCartPharmacyMetadataConsistency(items, record, context);

  const totalItems = requireSafeNonNegativeInteger(
    record,
    'totalItems',
    'cart',
    context
  );

  const totalPrice = requireNonNegativeFiniteNumber(
    record,
    'totalPrice',
    'cart',
    context
  );

  const issues = parseArray(record.issues, 'issues', parseCartIssue, context);

  const expectedTotalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (totalItems !== expectedTotalItems) {
    throw invalidDto(
      'cart.totalItems must equal the sum of item quantities.',
      record,
      context
    );
  }

  const expectedTotalPrice = items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  assertMoneyEqual(
    totalPrice,
    expectedTotalPrice,
    'cart.totalPrice must equal the sum of item totalPrice values.',
    record,
    context
  );

  return checked<Cart>({ revision, items, totalItems, totalPrice, issues });
}

//===================================================================

export function parseCartResponse(
  value: unknown,
  context?: ApiResponseContext
): CartResponse {
  const record = requireRecord(value, 'cart response', context);
  return { cart: parseCart(record.cart, context) };
}

//===================================================================

function parseClientOrder(
  value: unknown,
  context?: ApiResponseContext
): ClientOrder {
  const record = requireRecord(value, 'client order', context);
  requireFields(
    record,
    'client order',
    {
      id: 'string',
      orderNumber: 'string',
      createdAt: 'string',
      pharmacyId: 'string',
      pharmacyName: 'string',
      totalItems: 'number',
      totalPrice: 'number',
      currency: 'string',
      status: 'string',
      createdByType: 'string',
      statusHistory: 'array',
      activityHistory: 'array',
      paymentMethod: 'string',
      delivery: 'record',
      managerCommentsCount: 'number',
      items: 'array',
    },
    context
  );

  return checked<ClientOrder>(record);
}

//===================================================================

export function parseClientOrdersResponse(
  value: unknown,
  context?: ApiResponseContext
): ClientOrdersResponse {
  const record = requireRecord(value, 'client orders response', context);

  const pagination = requirePaginatedResponse(
    normalizePaginatedResponse(record, {
      normalizeItem: (item) => {
        try {
          return parseClientOrder(item, context);
        } catch {
          return null;
        }
      },
    }),
    { label: 'client orders response', ...context }
  );

  const statistics = requireRecord(
    record.statistics,
    'order statistics',
    context
  );

  const earliestCreatedAt = requireNullableString(
    record,
    'earliestCreatedAt',
    'client orders response',
    context
  );

  return checked<ClientOrdersResponse>({
    ...pagination,
    statistics,
    earliestCreatedAt,
  });
}

//===================================================================

export function parseClientOrderDetailsResponse(
  value: unknown,
  context?: ApiResponseContext
): ClientOrderDetailsResponse {
  const record = requireRecord(value, 'client order details response', context);
  return { order: parseClientOrder(record.order, context) };
}

//===================================================================

export function parseCheckoutOrderResponse(
  value: unknown,
  context?: ApiResponseContext
): CheckoutOrderResponse {
  const record = requireRecord(value, 'checkout response', context);

  return {
    order: parseClientOrder(record.order, context),
    cart: parseCart(record.cart, context),
  };
}

//===================================================================

export function parseOrderManagerCommentsResponse(
  value: unknown,
  context?: ApiResponseContext
): OrderManagerCommentsResponse {
  return checked<OrderManagerCommentsResponse>(
    requirePaginatedResponse(
      normalizePaginatedResponse(value, {
        normalizeItem: (item) => {
          const record = isRecord(item) ? item : null;
          if (!record) return null;
          if (
            typeof record.id !== 'string' ||
            typeof record.text !== 'string' ||
            typeof record.createdAt !== 'string' ||
            typeof record.createdBy !== 'string'
          )
            return null;
          return record;
        },
      }),
      { label: 'order manager comments response', ...context }
    )
  );
}

//===================================================================

function parseActiveSession(
  value: unknown,
  context?: ApiResponseContext
): ActiveSession {
  const record = requireRecord(value, 'active session', context);

  requireFields(
    record,
    'active session',
    {
      id: 'string',
      roleAtLogin: 'string',
      lastUsedAt: 'string',
      expiresAt: 'string',
      isCurrent: 'boolean',
    },
    context
  );

  requireOptionalFields(
    record,
    'active session',
    {
      deviceName: 'string',
      userAgent: 'string',
      ip: 'string',
      createdAt: 'string',
    },
    context
  );

  return checked<ActiveSession>(record);
}

//===================================================================

export function parseActiveSessionsResponse(
  value: unknown,
  context?: ApiResponseContext
): ActiveSessionsResponse {
  const record = requireRecord(value, 'active sessions response', context);

  return {
    sessions: parseArray(
      record.sessions,
      'sessions',
      parseActiveSession,
      context
    ),
  };
}

//===================================================================

export type HealthResponse = Readonly<{ status: string }>;

//===================================================================

export function parseHealthResponse(
  value: unknown,
  context?: ApiResponseContext
): HealthResponse {
  const record = requireRecord(value, 'health response', context);
  requireFields(record, 'health response', { status: 'string' }, context);
  return checked<HealthResponse>({ status: record.status });
}
