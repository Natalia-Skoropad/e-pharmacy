import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../transport/api-error';
import { parseApiEmptyResponse, parseApiResponseData } from './api-response';

import {
  parseActiveSessionsResponse,
  parseFavoriteMutationResponse,
  parseHealthResponse,
  parsePharmaciesResponse,
  parsePharmacyCheckoutDetailsResponse,
  parsePharmacyDetailsResponse,
  parsePharmacyDocumentContentResponse,
  parsePharmacyProfileResponse,
  parsePharmacyRegistrationDocumentUploadResponse,
  parsePharmacyRegistrationUploadSessionResponse,
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

  const validSession = {
    id: '507f1f77bcf86cd799439011',
    roleAtLogin: 'client',
    lastUsedAt: '2026-08-13T12:00:00.000Z',
    expiresAt: '2026-08-20T12:00:00.000Z',
    createdAt: '2026-08-13T11:00:00.000Z',
    isCurrent: true,
    deviceName: 'Chrome on Windows',
    userAgent: 'Mozilla/5.0',
    ip: '127.0.0.1',
  } as const;

  assert.deepEqual(parseActiveSessionsResponse({ sessions: [validSession] }), {
    sessions: [validSession],
  });

  for (const session of [
    { ...validSession, id: 'invalid' },
    { ...validSession, roleAtLogin: 'superadmin' },
    { ...validSession, lastUsedAt: 'tomorrow' },
    { ...validSession, expiresAt: '2026-08-20' },
    { ...validSession, createdAt: 'not-a-date' },
  ]) {
    assert.throws(
      () => parseActiveSessionsResponse({ sessions: [session] }),
      ApiError
    );
  }

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

  assert.throws(
    () =>
      parsePharmacyDetailsResponse({
        pharmacy: {
          ...pharmacy,
          bankDetails: {
            recipientName: 'E Pharmacy',
            taxId: '12345678',
            iban: 'UA123456789012345678901234567',
            bankName: 'Bank',
            receiptEmail: 'billing@example.com',
            paymentPurpose: 'Order payment',
          },
        },
      }),
    ApiError
  );

  const checkoutBankDetails = {
    recipientName: 'E Pharmacy',
    taxId: '12345678',
    iban: 'UA123456789012345678901234567',
    bankName: 'Bank',
    receiptEmail: 'billing@example.com',
    paymentPurpose: 'Order payment',
  };

  assert.deepEqual(
    parsePharmacyCheckoutDetailsResponse({
      pharmacy: {
        id: pharmacy.id,
        name: pharmacy.name,
        bankTransferAvailable: true,
        bankDetails: checkoutBankDetails,
      },
    }).pharmacy.bankDetails,
    checkoutBankDetails
  );

  assert.throws(
    () =>
      parsePharmacyCheckoutDetailsResponse({
        pharmacy: {
          id: pharmacy.id,
          name: pharmacy.name,
          bankTransferAvailable: true,
        },
      }),
    ApiError
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

//===================================================================

test('strictly validates pharmacy profile documents, status, dates and nested data', () => {
  const document = {
    id: '6a5f5240d9c46211621acf16',
    name: 'license.pdf',
    size: 1024,
    type: 'application/pdf',
    sha256: 'a'.repeat(64),
    uploadedAt: '2026-08-13T08:00:00.000Z',
  };

  const profile = {
    id: '6a5f5240d9c46211621acef3',
    membershipRole: 'owner',
    name: '',
    bankTransferAvailable: false,
    documents: [document],
    status: 'new',
    rating: 0,
    reviewsCount: 0,
    updatedAt: '2026-08-13T08:00:00.000Z',
    bankDetails: {
      iban: 'UA123456789012345678901234567',
      receiptEmail: 'billing@example.com',
    },
    pendingModeration: {
      phone: null,
      description: null,
      bankDetails: { receiptEmail: null },
      documents: [document],
    },
  };

  assert.equal(
    parsePharmacyProfileResponse({ pharmacy: profile }).pharmacy.documents[0]
      ?.id,
    document.id
  );

  const ownerProfile = parsePharmacyProfileResponse({
    pharmacy: profile,
  }).pharmacy;
  assert.equal(ownerProfile.pendingModeration?.phone, null);
  assert.equal(ownerProfile.pendingModeration?.description, null);
  assert.equal(ownerProfile.pendingModeration?.bankDetails?.receiptEmail, null);

  const managerProfile = parsePharmacyProfileResponse({
    pharmacy: {
      ...profile,
      membershipRole: 'manager',
      documents: [],
      bankDetails: undefined,
      pendingModeration: undefined,
    },
  }).pharmacy;

  assert.equal(managerProfile.membershipRole, 'manager');
  assert.equal(managerProfile.bankDetails, undefined);
  assert.deepEqual(managerProfile.documents, []);
  assert.equal(managerProfile.pendingModeration, undefined);

  for (const invalidProfile of [
    { ...profile, id: 'bad-id' },
    { ...profile, membershipRole: 'viewer' },
    { ...profile, status: 'something_new' },
    { ...profile, updatedAt: 'yesterday' },
    { ...profile, documents: [123] },
    { ...profile, documents: [{ ...document, sha256: 'bad' }] },
    { ...profile, documents: [{ ...document, size: 10 * 1024 * 1024 + 1 }] },
    { ...profile, documents: Array.from({ length: 7 }, () => document) },
    { ...profile, documents: [document, document] },
    { ...profile, bankDetails: { iban: 123 } },
    { ...profile, bankDetails: { iban: 'UA123' } },
    { ...profile, email: 'not-an-email' },
    { ...profile, phone: '0501234567' },
    { ...profile, workingHours: 'Open every day' },
    { ...profile, imageUrl: 'javascript:alert(1)' },
    { ...profile, pendingModeration: { documents: [null] } },
    { ...profile, pendingModeration: { phone: '0501234567' } },
  ]) {
    assert.throws(
      () => parsePharmacyProfileResponse({ pharmacy: invalidProfile }),
      (error: unknown) =>
        error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
    );
  }
});

//===================================================================

test('validates pharmacy registration upload-session responses', () => {
  const parsed = parsePharmacyRegistrationUploadSessionResponse({
    uploadSessionId: '6a5f5240d9c46211621acf17',
    uploadToken: 'a'.repeat(64),
    expiresAt: '2026-08-13T09:00:00.000Z',
    maxFiles: 6,
    maxTotalSizeBytes: 30 * 1024 * 1024,
  });

  assert.equal(parsed.maxFiles, 6);
  assert.equal(parsed.uploadToken.length, 64);

  for (const invalid of [
    { ...parsed, uploadSessionId: 'bad-id' },
    { ...parsed, uploadToken: 'short' },
    { ...parsed, expiresAt: 'tomorrow' },
    { ...parsed, maxFiles: 0 },
    { ...parsed, maxTotalSizeBytes: 0 },
  ]) {
    assert.throws(
      () => parsePharmacyRegistrationUploadSessionResponse(invalid),
      ApiError
    );
  }
});

//===================================================================

test('validates controlled pharmacy registration upload responses', () => {
  const document = {
    id: '6a5f5240d9c46211621acf16',
    name: 'license.pdf',
    size: 1024,
    type: 'application/pdf',
    sha256: 'b'.repeat(64),
    uploadedAt: '2026-08-13T08:00:00.000Z',
  };

  assert.equal(
    parsePharmacyRegistrationDocumentUploadResponse({
      document,
      claimToken: 'c'.repeat(64),
    }).document.id,
    document.id
  );

  assert.throws(
    () =>
      parsePharmacyRegistrationDocumentUploadResponse({
        document,
        claimToken: 'short',
      }),
    ApiError
  );
});

//===================================================================

test('validates controlled pharmacy document content responses', () => {
  const document = {
    id: '6a5f5240d9c46211621acf16',
    name: 'license.pdf',
    size: 8,
    type: 'application/pdf',
    sha256: 'd'.repeat(64),
    uploadedAt: '2026-08-13T08:00:00.000Z',
  };

  assert.equal(
    parsePharmacyDocumentContentResponse({
      document,
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjQ=',
    }).document.id,
    document.id
  );

  assert.throws(
    () =>
      parsePharmacyDocumentContentResponse({
        document,
        dataUrl: 'data:image/png;base64,JVBERi0xLjQ=',
      }),
    ApiError
  );
});
