import assert from 'node:assert/strict';
import test from 'node:test';

import { PHARMACY_DOCUMENT_RULES } from '../../constants/pharmacies/pharmacy-document-validation';
import { PRODUCT_REQUEST_ATTACHMENT_RULES } from '../../constants/catalog/product-request-validation';

import {
  adminProductRequestsQuerySchema,
  productRequestsQuerySchema,
  productRequestFormSchema,
  productRequestModerationSchema,
} from './product-request.schema';

//===============================================================

const validDraft = {
  status: 'new' as const,
  name: 'Paracetamol',
  article: 'MED-001',
  categoryMode: 'catalog' as const,
  categoryId: '507f1f77bcf86cd799439011',
};

const validProductImage = {
  name: 'product.webp',
  type: 'image/webp' as const,
  size: 1,
  dataUrl: 'data:image/webp;base64,AA==',
};

const validSubmission = {
  ...validDraft,
  status: 'new' as const,
  productImage: validProductImage,
  brand: 'HealthCare',
  series: 'Everyday',
  manufacturer: 'Pharmaco',
  releaseForm: 'Tablets',
  activeIngredients: 'Paracetamol',
  activeIngredientCount: 'Paracetamol: 500 mg per tablet',
  fullDescription: 'Complete product description in English. '.repeat(3),
};

//===============================================================

test('New status saves name-only requests without forcing moderation fields', () => {
  const parsed = productRequestFormSchema.safeParse({
    status: 'new',
    name: 'Name only request',
    article: '',
    categoryMode: 'catalog',
  });

  assert.equal(parsed.success, true);

  assert.equal(
    productRequestFormSchema.safeParse({
      status: 'draft',
      name: 'Legacy',
      article: '',
      categoryMode: 'catalog',
    }).success,
    false
  );
});

//===============================================================

test('product request schema rejects article whitespace and category names over 100 characters', () => {
  for (const article of ['AA 11', ' AA-11', 'AA-11 ']) {
    assert.equal(
      productRequestFormSchema.safeParse({ ...validDraft, article }).success,
      false
    );
  }

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      categoryMode: 'custom',
      categoryId: undefined,
      customCategory: 'A'.repeat(101),
    }).success,
    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      categoryMode: 'custom',
      categoryId: undefined,
      customCategory: 'A'.repeat(100),
    }).success,
    true
  );
});

//===============================================================

test('product request schema accepts English draft and submission values', () => {
  assert.equal(productRequestFormSchema.safeParse(validDraft).success, true);

  assert.equal(
    productRequestFormSchema.safeParse(validSubmission).success,
    true
  );
});

//===============================================================

test('product request schema rejects non-English text', () => {
  assert.equal(
    productRequestFormSchema.safeParse({ ...validDraft, name: 'Парацетамол' })
      .success,
    false
  );
});

//===============================================================

test('product request schema enforces field length boundaries', () => {
  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      name: 'A'.repeat(160),
      article: 'A'.repeat(40),
    }).success,

    true
  );

  assert.equal(
    productRequestFormSchema.safeParse({ ...validDraft, name: 'A'.repeat(161) })
      .success,

    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      article: 'A'.repeat(41),
    }).success,

    false
  );
});

//===============================================================

test('product request schema normalizes blank optional text to undefined', () => {
  const parsed = productRequestFormSchema.parse({
    ...validDraft,
    manufacturer: '   ',
    pharmacyComment: '',
  });

  assert.equal(parsed.manufacturer, undefined);
  assert.equal(parsed.pharmacyComment, undefined);
});

//===============================================================

test('New requests may have a partial category, but category combinations remain consistent', () => {
  const partial = {
    ...validDraft,
    categoryMode: 'custom' as const,
    categoryId: undefined,
    customCategory: '',
  };

  assert.equal(productRequestFormSchema.safeParse(partial).success, true);

  assert.equal(
    productRequestFormSchema.safeParse({
      ...partial,
      categoryId: validDraft.categoryId,
    }).success,
    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...partial,
      customCategory: 'Other medicine',
    }).success,
    true
  );
});

//===============================================================

test('owner submission is a separate action, not a status in the Save form', () => {
  assert.equal(productRequestFormSchema.safeParse(validDraft).success, true);

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      status: 'on_moderation',
    }).success,
    false
  );

  assert.equal(
    productRequestFormSchema.safeParse(validSubmission).success,
    true
  );
});

//===============================================================

test('New Save form allows optional characteristics; submit service validates required fields', () => {
  for (const field of [
    'brand',
    'series',
    'manufacturer',
    'releaseForm',
    'activeIngredients',
    'activeIngredientCount',
  ] as const) {
    assert.equal(
      productRequestFormSchema.safeParse({
        ...validSubmission,
        [field]: undefined,
      }).success,

      true,
      field
    );
  }

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      activeIngredientCount: 'Vitamin C: 500 mg, calcium: 55 mg',
    }).success,
    true
  );
});

//===============================================================

test('About product follows the 100-character boundary', () => {
  assert.equal(
    productRequestFormSchema.safeParse({ ...validDraft, fullDescription: '' })
      .success,
    true
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      fullDescription: 'A'.repeat(99),
    }).success,
    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      fullDescription: 'A'.repeat(100),
    }).success,
    true
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      fullDescription: 'A'.repeat(99),
    }).success,
    false
  );
});

//===============================================================

test('product request schema accepts rich text markdown links and lists', () => {
  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      fullDescription:
        '# Heading\n\n**Bold** text with [link](https://example.com/path?q=test&source=pharmacy).\n\n1. First item\n2. Second item',
    }).success,

    true
  );
});

//===============================================================

test('product request schema enforces image MIME, extension and size', () => {
  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      productImage: { ...validProductImage, size: 0 },
    }).success,

    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,

      productImage: {
        ...validProductImage,
        name: 'product.gif',
        type: 'image/png',
      },
    }).success,

    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      productImage: { ...validProductImage, size: 2 * 1024 * 1024 + 1 },
    }).success,

    false
  );
});

//===============================================================

test('request document limits match pharmacy verification document rules', () => {
  assert.equal(
    PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles,
    PHARMACY_DOCUMENT_RULES.maxFiles
  );

  assert.equal(
    PRODUCT_REQUEST_ATTACHMENT_RULES.maxSizeBytes,
    PHARMACY_DOCUMENT_RULES.maxSizeBytes
  );

  assert.equal(
    PRODUCT_REQUEST_ATTACHMENT_RULES.maxTotalSizeBytes,
    PHARMACY_DOCUMENT_RULES.maxTotalSizeBytes
  );

  assert.deepEqual(
    PRODUCT_REQUEST_ATTACHMENT_RULES.mimeTypes,
    PHARMACY_DOCUMENT_RULES.mimeTypes
  );

  assert.equal(
    PRODUCT_REQUEST_ATTACHMENT_RULES.fileNamePattern.source,
    PHARMACY_DOCUMENT_RULES.fileNamePattern.source
  );
});

//===============================================================

test('product request schema stores attachment data and checks MIME consistency', () => {
  const validFile = {
    name: 'instruction.pdf',
    type: 'application/pdf' as const,
    size: 1,
    dataUrl: 'data:application/pdf;base64,AA==',
  };

  const parsed = productRequestFormSchema.parse({
    ...validSubmission,
    additionalFiles: [validFile],
  });

  assert.equal(parsed.additionalFiles?.[0]?.dataUrl, validFile.dataUrl);

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      additionalFiles: [{ ...validFile, size: 0 }],
    }).success,

    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      additionalFiles: [{ ...validFile, dataUrl: undefined }],
    }).success,

    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,

      additionalFiles: [
        { ...validFile, dataUrl: 'data:image/png;base64,AA==' },
      ],
    }).success,

    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      additionalFiles: [{ ...validFile, size: 2 }],
    }).success,

    false
  );
});

//===============================================================

test('product request moderation schema enforces the admin transition payload', () => {
  assert.equal(
    productRequestModerationSchema.safeParse({ status: 'on_moderation' })
      .success,
    false
  );

  assert.equal(
    productRequestModerationSchema.safeParse({
      status: 'on_moderation',
      reviewState: 'changes_requested',
      reason: 'Please supply a better image.',
    }).success,
    true
  );

  assert.equal(
    productRequestModerationSchema.safeParse({ status: 'rejected' }).success,
    false
  );

  assert.equal(
    productRequestModerationSchema.safeParse({
      status: 'rejected',
      reason: 'The submitted information needs correction.',
    }).success,

    true
  );

  assert.equal(
    productRequestModerationSchema.safeParse({
      status: 'approved',
      productId: '507f1f77bcf86cd799439011',
    }).success,

    true
  );

  assert.equal(
    productRequestModerationSchema.safeParse({
      status: 'on_moderation',
      productId: '507f1f77bcf86cd799439011',
    }).success,

    false
  );

  assert.equal(
    productRequestModerationSchema.safeParse({ status: 'new' }).success,
    false
  );
});

//===============================================================

test('product request accepts stored attachment references without Base64 but rejects ambiguous mixed payloads', () => {
  const file = {
    documentId: '507f1f77bcf86cd799439011',
    name: 'instruction.pdf',
    type: 'application/pdf',
    size: 100,
  };

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      additionalFiles: [file],
    }).success,
    true
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      additionalFiles: [
        { ...file, dataUrl: 'data:application/pdf;base64,AA==' },
      ],
    }).success,
    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      additionalFiles: [{ name: file.name, type: file.type, size: file.size }],
    }).success,
    false
  );
});

//===============================================================

// Admin filtering must not expand the owner-facing request query contract.
test('admin registry supports combined owner, request, date, category and status filters', () => {
  const query = {
    ownerId: '507f1f77bcf86cd799439011',
    requestId: '507f1f77bcf86cd799439012',
    dateFrom: '2026-11-01',
    dateTo: '2026-11-25',
    category: 'medicine',
    status: 'on_moderation',
    page: '2',
    perPage: '50',
  };

  const result = adminProductRequestsQuerySchema.parse(query);

  assert.equal(result.ownerId, query.ownerId);
  assert.equal(result.requestId, query.requestId);
  assert.equal(result.page, 2);
  assert.equal(result.perPage, 50);
  assert.equal(productRequestsQuerySchema.safeParse(query).success, false);

  assert.equal(
    adminProductRequestsQuerySchema.safeParse({ ...query, ownerId: 'invalid' })
      .success,
    false
  );

  assert.equal(
    adminProductRequestsQuerySchema.safeParse({
      ...query,
      dateTo: '2026-10-31',
    }).success,
    false
  );

  assert.equal(
    adminProductRequestsQuerySchema.safeParse({
      ...query,
      categoryMode: 'custom',
    }).success,
    false
  );
});
