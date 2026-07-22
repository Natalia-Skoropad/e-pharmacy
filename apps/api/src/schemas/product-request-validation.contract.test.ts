import assert from 'node:assert/strict';
import test from 'node:test';

import { productRequestFormSchema } from './product-request.schema';

//===============================================================

const validDraft = {
  status: 'draft' as const,
  name: 'Парацетамол',
  article: 'MED-001',
  category: 'medicine' as const,
};

const validProductImage = {
  name: 'product.webp',
  type: 'image/webp' as const,
  size: 2 * 1024 * 1024,
  dataUrl: 'data:image/webp;base64,AA==',
};

const validSubmission = {
  ...validDraft,
  status: 'new' as const,
  productImage: validProductImage,
  manufacturer: 'Фармак',
  countryOfOrigin: 'Україна',
  dosage: '500 мг',
  packageSize: '20 таблеток',
  form: 'Таблетки',
  activeSubstance: 'Парацетамол',
  prescriptionType: 'non_prescription',
  fullDescription: 'Повний опис препарату українською мовою.',
};

//===============================================================

test('product request schema accepts Ukrainian draft and submission values', () => {
  assert.equal(productRequestFormSchema.safeParse(validDraft).success, true);

  assert.equal(
    productRequestFormSchema.safeParse(validSubmission).success,
    true
  );
});

//===============================================================

test('product request schema enforces field length boundaries', () => {
  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      name: 'а'.repeat(160),
      article: 'A'.repeat(40),
    }).success,
    true
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validDraft,
      name: 'а'.repeat(161),
    }).success,
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
      customCategory: 'Інше',
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
      productImage: {
        ...validProductImage,
        size: 2 * 1024 * 1024 + 1,
      },
    }).success,
    false
  );
});

//===============================================================

test('product request schema enforces attachment MIME and extension', () => {
  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      additionalFiles: [
        {
          name: 'instruction.pdf',
          type: 'application/pdf',
          size: 100,
        },
      ],
    }).success,
    true
  );

  assert.equal(
    productRequestFormSchema.safeParse({
      ...validSubmission,
      additionalFiles: [
        {
          name: 'archive.zip',
          type: 'application/pdf',
          size: 100,
        },
      ],
    }).success,
    false
  );
});
