import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../transport/api-error';
import { parseApiEmptyResponse, parseApiResponseData } from './api-response';

import {
  parseActiveSessionsResponse,
  parseFavoriteMutationResponse,
  parseHealthResponse,
  parsePharmaciesResponse,
  parsePharmacyDetailsResponse,
  parseProductDetails,
  parseProductsResponse,
} from './shared-dto-parsers';

//===================================================================

test('parses an endpoint DTO only after validating the success envelope', () => {
  assert.deepEqual(
    parseApiResponseData(
      { status: 'success', data: { status: 'ok' } },
      parseHealthResponse,
      { url: '/health', method: 'GET' }
    ),

    { status: 'ok' }
  );

  assert.throws(
    () =>
      parseApiResponseData(
        { status: 'error', data: { status: 'ok' } },
        parseHealthResponse,
        { url: '/health', method: 'GET' }
      ),

    (error: unknown) =>
      error instanceof ApiError &&
      error.transportCode === 'INVALID_RESPONSE' &&
      error.url === '/health'
  );
});

//===================================================================

test('rejects invalid endpoint DTO fields instead of trusting a generic type', () => {
  assert.throws(
    () =>
      parseApiResponseData(
        {
          status: 'success',
          data: { isFavorite: 'yes', message: 'Updated' },
        },
        parseFavoriteMutationResponse
      ),

    (error: unknown) =>
      error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );
});

//===================================================================

test('validates shared pagination response contracts', () => {
  assert.deepEqual(
    parseProductsResponse({
      items: [],
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    }),

    {
      items: [],
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 0,
      earliestCreatedAt: null,
    }
  );

  assert.throws(
    () =>
      parseProductsResponse({
        items: [],
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 1,
        earliestCreatedAt: null,
      }),
    ApiError
  );
});

//===================================================================

test('distinguishes empty success envelopes from data envelopes', () => {
  assert.equal(
    parseApiEmptyResponse({ status: 'success', message: 'Done' }),
    undefined
  );

  assert.throws(
    () => parseApiEmptyResponse({ status: 'success', data: null }),
    ApiError
  );
});

//===================================================================

test('validates active sessions at runtime', () => {
  assert.deepEqual(parseActiveSessionsResponse({ sessions: [] }), {
    sessions: [],
  });

  assert.throws(
    () => parseActiveSessionsResponse({ sessions: 'invalid' }),
    ApiError
  );
});

//===================================================================

test('requires backend-provided typed public slug IDs', () => {
  const product = {
    id: '6a5f5242d9c46211621ad70a',
    name: 'Amlodipine 5 mg Acme',
    publicSlugId: 'amlodipine-5-mg-acme-pr6a5f5242d9c46211621ad70a',
    article: 'AML-5',
    category: 'prescription',
    status: 'active',
    price: 100,
    foundInPharmaciesCount: 1,
    availableInPharmaciesCount: 1,
    inStock: true,
    rating: 5,
    reviewsCount: 1,
    isFavorite: false,
    createdAt: '2026-07-31T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
    offers: [],
  };

  assert.equal(parseProductDetails(product).publicSlugId, product.publicSlugId);

  assert.throws(
    () => parseProductDetails({ ...product, publicSlugId: undefined }),
    ApiError
  );

  const validOffer = {
    id: '6a5f5242d9c46211621ad70b',
    pharmacyId: '6a5f5244a3defb1d037f06e7',
    pharmacyName: 'Pharmacy Care Pharmacy Lviv',
    pharmacyRating: 5,
    pharmacyReviewsCount: 2,
    pharmacyIsFavorite: false,
    price: 100,
    totalQuantity: 10,
    availableQuantity: 8,
    reservedQuantity: 2,
    inStock: true,
    createdAt: '2026-07-31T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
  };

  assert.equal(
    parseProductDetails({ ...product, offers: [validOffer] }).offers[0]
      ?.availableQuantity,
    8
  );

  for (const invalidQuantity of [
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    assert.throws(
      () =>
        parseProductDetails({
          ...product,
          offers: [{ ...validOffer, availableQuantity: invalidQuantity }],
        }),
      (error: unknown) =>
        error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
    );
  }

  for (const invalidOffer of [
    { ...validOffer, availableQuantity: 11 },
    { ...validOffer, reservedQuantity: 11 },
    { ...validOffer, availableQuantity: 9, reservedQuantity: 2 },
    { ...validOffer, availableQuantity: 0, reservedQuantity: 2, inStock: true },
    {
      ...validOffer,
      availableQuantity: 8,
      reservedQuantity: 2,
      inStock: false,
    },
  ]) {
    assert.throws(
      () => parseProductDetails({ ...product, offers: [invalidOffer] }),
      (error: unknown) =>
        error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
    );
  }

  const productSummary = {
    id: product.id,
    name: product.name,
    publicSlugId: product.publicSlugId,
    article: product.article,
    category: product.category,
    status: product.status,
    price: 100,
    minPrice: 90,
    maxPrice: 110,
    foundInPharmaciesCount: 3,
    availableInPharmaciesCount: 3,
    inStock: true,
    rating: 5,
    reviewsCount: 1,
    isFavorite: false,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  assert.equal(
    parseProductsResponse({
      items: [productSummary],
      page: 1,
      perPage: 10,
      total: 1,
      totalPages: 1,
      earliestCreatedAt: null,
    }).items[0]?.minPrice,
    90
  );

  assert.throws(
    () =>
      parseProductsResponse({
        items: [
          {
            ...productSummary,
            offers: Array.from({ length: 25 }, () => validOffer),
          },
        ],
        page: 1,
        perPage: 10,
        total: 1,
        totalPages: 1,
        earliestCreatedAt: null,
      }),

    (error: unknown) =>
      error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );

  const pharmacy = {
    id: '6a5f5244a3defb1d037f06e7',
    name: 'Pharmacy Care Pharmacy Lviv',
    publicSlugId: 'pharmacy-care-pharmacy-lviv-ph6a5f5244a3defb1d037f06e7',
    rating: 5,
    availableProductsCount: 10,
    reviewsCount: 2,
    isFavorite: false,
    bankTransferAvailable: true,
    updatedAt: '2026-07-31T00:00:00.000Z',
  };

  const pharmacySummary = {
    id: pharmacy.id,
    name: pharmacy.name,
    publicSlugId: pharmacy.publicSlugId,
    rating: pharmacy.rating,
    availableProductsCount: pharmacy.availableProductsCount,
    reviewsCount: pharmacy.reviewsCount,
    isFavorite: false,
  };

  assert.equal(
    parsePharmaciesResponse({
      items: [pharmacySummary],
      page: 1,
      perPage: 10,
      total: 1,
      totalPages: 1,
    }).items[0]?.name,
    pharmacy.name
  );

  assert.throws(
    () =>
      parsePharmaciesResponse({
        items: [{ ...pharmacySummary, bankDetails: { iban: 'UA00' } }],
        page: 1,
        perPage: 10,
        total: 1,
        totalPages: 1,
      }),
    ApiError
  );

  assert.equal(
    parsePharmacyDetailsResponse({ pharmacy }).pharmacy.publicSlugId,
    pharmacy.publicSlugId
  );
});

//===================================================================

function createValidCartResponse() {
  return {
    revision: 7,
    items: [
      {
        id: '507f1f77bcf86cd799439011',
        productOfferId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        pharmacyId: '507f1f77bcf86cd799439014',

        product: {
          id: '507f1f77bcf86cd799439013',
          name: 'Aspirin',
          article: 'ASP-100',
          category: 'medicine',
          price: 100,
          pharmacyName: 'Health Pharmacy',
          inStock: true,
          rating: 4.8,
          reviewsCount: 12,
        },

        pharmacyName: 'Health Pharmacy',
        pharmacyRating: 4.9,
        pharmacyReviewsCount: 25,
        stockQuantity: 3,
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
        expiresAt: '2026-08-15T10:00:00.000Z',
      },
    ],

    totalItems: 2,
    totalPrice: 200,
    issues: [],
  };
}

//===================================================================

test('strictly validates transactional cart responses', async () => {
  const { parseCartResponse } = await import('./shared-dto-parsers');
  const valid = createValidCartResponse();

  assert.equal(parseCartResponse({ cart: valid }).cart.revision, 7);

  const invalidCarts = [
    {
      ...valid,
      items: [{ ...valid.items[0], id: 'not-an-object-id' }],
    },
    {
      ...valid,
      items: [{ ...valid.items[0], quantity: 1.5 }],
    },
    {
      ...valid,
      items: [{ ...valid.items[0], quantity: 100 }],
    },
    {
      ...valid,
      items: [{ ...valid.items[0], stockQuantity: -1 }],
    },
    {
      ...valid,
      items: [{ ...valid.items[0], expiresAt: '2026-08-15' }],
    },
    {
      ...valid,
      items: [
        {
          ...valid.items[0],
          product: { ...valid.items[0].product, category: 'invalid-category' },
        },
      ],
    },
    {
      ...valid,
      items: [{ ...valid.items[0], totalPrice: 199 }],
    },
    { ...valid, totalItems: 3 },
    { ...valid, totalPrice: 201 },
  ];

  for (const cart of invalidCarts) {
    assert.throws(
      () => parseCartResponse({ cart }),
      (error: unknown) =>
        error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
    );
  }
});

//===================================================================

test('rejects inconsistent pharmacy metadata across one cart group', async () => {
  const { parseCartResponse } = await import('./shared-dto-parsers');
  const valid = createValidCartResponse();
  const firstItem = valid.items[0];

  const secondItem = {
    ...firstItem,
    id: '507f1f77bcf86cd799439021',
    productOfferId: '507f1f77bcf86cd799439022',
    productId: '507f1f77bcf86cd799439023',
    product: {
      ...firstItem.product,
      id: '507f1f77bcf86cd799439023',
      pharmacyName: 'Changed Pharmacy Name',
    },
    pharmacyName: 'Changed Pharmacy Name',
  };

  assert.throws(
    () =>
      parseCartResponse({
        cart: {
          ...valid,
          items: [firstItem, secondItem],
          totalItems: firstItem.quantity + secondItem.quantity,
          totalPrice: firstItem.totalPrice + secondItem.totalPrice,
        },
      }),
    (error: unknown) =>
      error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
  );
});

//===================================================================

test('validates cart cleanup issues instead of silently dropping them', async () => {
  const { parseCartResponse } = await import('./shared-dto-parsers');
  const valid = createValidCartResponse();

  const parsed = parseCartResponse({
    cart: {
      ...valid,
      items: [],
      totalItems: 0,
      totalPrice: 0,
      issues: [
        {
          cartItemId: '507f1f77bcf86cd799439011',
          reason: 'product_unavailable',
        },
      ],
    },
  });

  assert.equal(parsed.cart.issues[0]?.reason, 'product_unavailable');

  assert.throws(
    () =>
      parseCartResponse({
        cart: {
          ...valid,
          items: [],
          totalItems: 0,
          totalPrice: 0,
          issues: [
            {
              cartItemId: '507f1f77bcf86cd799439011',
              reason: 'unknown',
            },
          ],
        },
      }),
    ApiError
  );
});
