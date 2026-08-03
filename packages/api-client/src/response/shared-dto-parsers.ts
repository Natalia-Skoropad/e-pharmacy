import type {
  FavoriteIdsResponse,
  FavoriteMutationResponse,
} from '@e-pharmacy/types/api';

import type {
  ActiveSession,
  ActiveSessionsResponse,
} from '@e-pharmacy/types/auth';

import type { Cart, CartItem, CartResponse } from '@e-pharmacy/types/cart';

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
  PharmacyFilterOptionsResponse,
  PharmacyOption,
  PharmacyOptionsResponse,
  PharmacyProfile,
  PharmacyProfileResponse,
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

function parsePharmacyProfile(
  value: unknown,
  context?: ApiResponseContext
): PharmacyProfile {
  const record = requireRecord(value, 'pharmacy profile', context);

  requireFields(
    record,
    'pharmacy profile',
    {
      id: 'string',
      name: 'string',
      bankTransferAvailable: 'boolean',
      documents: 'array',
      status: 'string',
      rating: 'number',
      reviewsCount: 'number',
      updatedAt: 'string',
    },
    context
  );

  return checked<PharmacyProfile>(record);
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

  return checked<CartItem>(record);
}

//===================================================================

function parseCart(value: unknown, context?: ApiResponseContext): Cart {
  const record = requireRecord(value, 'cart', context);

  requireFields(
    record,
    'cart',
    { totalItems: 'number', totalPrice: 'number' },
    context
  );

  return checked<Cart>({
    items: parseArray(record.items, 'items', parseCartItem, context),
    totalItems: record.totalItems,
    totalPrice: record.totalPrice,
  });
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
