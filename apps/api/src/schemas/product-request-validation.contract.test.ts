import assert from 'node:assert/strict';
import test from 'node:test';

import { productRequestFormSchema } from './product-request.schema';

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

test('product request schema enforces image MIME, extension and size', () => {
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
