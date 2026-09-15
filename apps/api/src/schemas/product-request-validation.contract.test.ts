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
  category: 'medicine' as const,
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
  manufacturer: 'Pharmaco',
  countryOfOrigin: 'United Kingdom',
  dosage: '500 mg',
  packageSize: '20 tablets',
  form: 'Tablets',
  activeSubstance: 'Paracetamol',
  prescriptionType: 'non_prescription',
  fullDescription: 'Complete product description in English.',
};

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

test('product request schema requires custom category for other', () => {
  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      category: 'other',
      customCategory: '',
    }).success,
    false
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      category: 'other',
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

test('product request schema keeps Product data fields optional for moderation', () => {
  const productDataFields = new Set([
    'dosage',
    'packageSize',
    'form',
    'activeSubstance',
    'prescriptionType',
  ]);

  const submissionWithoutProductData = Object.fromEntries(
    Object.entries(validSubmission).filter(
      ([key]) => !productDataFields.has(key)
    )
  );

  assert.equal(
    productRequestFormSchema.safeParse(submissionWithoutProductData).success,
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
