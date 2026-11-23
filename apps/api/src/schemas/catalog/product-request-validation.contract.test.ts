import assert from 'node:assert/strict';
import test from 'node:test';

import {
  productRequestFormSchema,
  productRequestModerationSchema,
} from './product-request.schema';

//===============================================================

const validDraft = {
  status: 'draft' as const,
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
  fullDescription: 'Complete product description in English.',
};

//===============================================================

test('product request schema accepts a name-only draft without an article or category', () => {
  const parsed = productRequestFormSchema.safeParse({
    status: 'draft',
    name: 'Name only draft',
    article: '',
    categoryMode: 'catalog',
  });

  assert.equal(parsed.success, true);

  assert.equal(
    productRequestFormSchema.safeParse({
      status: 'new',
      name: 'Incomplete submission',
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

test('product request schema permits a partial category in drafts but requires it for moderation', () => {
  const partial = {
    ...validDraft,
    categoryMode: 'custom' as const,
    categoryId: undefined,
    customCategory: '',
  };

  assert.equal(productRequestFormSchema.safeParse(partial).success, true);

  assert.equal(
    productRequestFormSchema.safeParse({ ...partial, status: 'new' }).success,
    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      categoryMode: 'custom',
      categoryId: undefined,
      customCategory: 'Other medicine',
    }).success,
    true
  );
});

//===============================================================

test('product request schema enforces moderation-required fields', () => {
  assert.equal(
    productRequestFormSchema.safeParse({ ...validDraft, status: 'new' })
      .success,
    false
  );

  assert.equal(
    productRequestFormSchema.safeParse(validSubmission).success,
    true
  );
});

//===============================================================

test('backend requires brand, series and manufacturer on moderation', () => {
  const required = ['brand', 'series', 'manufacturer'] as const;

  for (const field of required) {
    const submission = { ...validSubmission, [field]: undefined };

    assert.equal(
      productRequestFormSchema.safeParse(submission).success,
      false,
      field
    );

    assert.equal(
      productRequestFormSchema.safeParse({ ...submission, status: 'draft' })
        .success,
      true,
      `${field} draft`
    );
  }

  for (const field of [
    'releaseForm',
    'activeIngredients',
    'activeIngredientCount',
  ] as const) {
    assert.equal(
      productRequestFormSchema.safeParse({
        ...validSubmission,
        [field]: undefined,
      }).success,
      true
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
    productRequestModerationSchema.safeParse({ status: 'in_progress' }).success,
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
      status: 'in_progress',
      productId: '507f1f77bcf86cd799439011',
    }).success,

    false
  );

  assert.equal(
    productRequestModerationSchema.safeParse({ status: 'new' }).success,
    false
  );
});
