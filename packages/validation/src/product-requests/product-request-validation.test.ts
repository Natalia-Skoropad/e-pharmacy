import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_INITIAL_VALUES,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
  isProductRequestDraftValid,
  isProductRequestSubmissionValid,
  normalizeProductRequestForm,
  normalizeProductRequestLatinInput,
  normalizeProductRequestArticleInput,
  toProductRequestFileMetadata,
  validateProductRequestAdditionalFiles,
  validateProductRequestForm,
  validateProductRequestImageFile,
  type ProductRequestFormValues,
} from './index';

import { PHARMACY_DOCUMENT_RULES } from '../files/pharmacy-document-validation';

//=============================================================================

type ProductRequestTextField = Exclude<
  keyof ProductRequestFormValues,
  'categoryMode' | 'categoryId'
>;

//=============================================================================

const FIELD_LIMIT_CASES: ReadonlyArray<
  readonly [ProductRequestTextField, number]
> = [
  ['name', PRODUCT_REQUEST_LIMITS.nameMax],
  ['article', PRODUCT_REQUEST_LIMITS.articleMax],
  ['customCategory', PRODUCT_REQUEST_LIMITS.customCategoryMax],
  ['brand', PRODUCT_REQUEST_LIMITS.brandMax],
  ['series', PRODUCT_REQUEST_LIMITS.seriesMax],
  ['releaseForm', PRODUCT_REQUEST_LIMITS.releaseFormMax],
  ['activeIngredients', PRODUCT_REQUEST_LIMITS.activeIngredientsMax],
  ['activeIngredientCount', PRODUCT_REQUEST_LIMITS.activeIngredientCountMax],
  ['manufacturer', PRODUCT_REQUEST_LIMITS.manufacturerMax],
  ['fullDescription', PRODUCT_REQUEST_LIMITS.fullDescriptionMax],
  ['pharmacyComment', PRODUCT_REQUEST_LIMITS.pharmacyCommentMax],
];

//=============================================================================

const validImage = {
  name: 'product.webp',
  type: 'image/webp',
  size: 1,
  dataUrl: 'data:image/webp;base64,AA==',
} as const;

//=============================================================================

function createDraftValues(
  overrides: Partial<ProductRequestFormValues> = {}
): ProductRequestFormValues {
  return {
    ...PRODUCT_REQUEST_INITIAL_VALUES,
    name: 'Paracetamol',
    article: 'med-001',
    categoryMode: 'catalog',
    categoryId: '507f1f77bcf86cd799439011',
    ...overrides,
  };
}

//=============================================================================

function createSubmissionValues(
  overrides: Partial<ProductRequestFormValues> = {}
): ProductRequestFormValues {
  return createDraftValues({
    brand: 'HealthCare',
    series: 'Everyday',
    manufacturer: 'Pharmaco',
    releaseForm: 'Tablets',
    activeIngredients: 'Paracetamol',
    activeIngredientCount: 'Paracetamol: 500 mg per tablet',
    fullDescription: 'Complete product description in English. '.repeat(3),
    ...overrides,
  });
}

//=============================================================================

function withTextField(
  values: ProductRequestFormValues,
  field: ProductRequestTextField,
  value: string
): ProductRequestFormValues {
  return { ...values, [field]: value };
}

//=============================================================================

test('draft validation requires only a valid name, while moderation requires article and category', () => {
  assert.equal(
    isProductRequestDraftValid(PRODUCT_REQUEST_INITIAL_VALUES),
    false
  );

  assert.equal(isProductRequestDraftValid(createDraftValues()), true);

  assert.equal(
    isProductRequestDraftValid({
      ...PRODUCT_REQUEST_INITIAL_VALUES,
      name: 'Valid draft name',
    }),
    true
  );

  assert.equal(
    isProductRequestSubmissionValid({
      ...PRODUCT_REQUEST_INITIAL_VALUES,
      name: 'Valid draft name',
    }),
    false
  );
});

//=============================================================================

test('validation enforces every field boundary without relying on JSX', () => {
  const baseValues = createDraftValues();

  for (const [field, maxLength] of FIELD_LIMIT_CASES) {
    const boundaryErrors = validateProductRequestForm(
      withTextField(baseValues, field, 'A'.repeat(maxLength)),
      'draft'
    );

    const overflowErrors = validateProductRequestForm(
      withTextField(baseValues, field, 'A'.repeat(maxLength + 1)),
      'draft'
    );

    assert.equal(boundaryErrors[field], undefined, `${field} boundary`);
    assert.ok(overflowErrors[field], `${field} overflow`);
  }
});

//=============================================================================

test('validation rejects non-English product text without changing it', () => {
  const values = createDraftValues({
    name: 'Парацетамол',
    fullDescription: 'Опис українською мовою.',
  });

  const errors = validateProductRequestForm(values, 'draft');
  const payload = normalizeProductRequestForm(values, 'new');

  assert.ok(errors.name);
  assert.ok(errors.fullDescription);
  assert.equal(payload.name, 'Парацетамол');
  assert.equal(payload.fullDescription, 'Опис українською мовою.');
});

//=============================================================================

test('catalog category mode requires a category id without hardcoded membership checks', () => {
  const missingCategory = validateProductRequestForm(
    createDraftValues({ categoryId: '   ' }),
    'draft'
  );

  const dynamicCategory = validateProductRequestForm(
    createDraftValues({ categoryId: 'future-category-id-from-db' }),
    'draft'
  );

  assert.equal(missingCategory.categoryId, undefined);

  assert.ok(
    validateProductRequestForm(
      createDraftValues({ categoryId: '   ' }),
      'moderation'
    ).categoryId
  );

  assert.equal(dynamicCategory.categoryId, undefined);
});

//=============================================================================

test('validation rejects an unsupported category mode', () => {
  const values = createDraftValues();

  Reflect.set(values, 'categoryMode', 'unsupported');

  assert.ok(validateProductRequestForm(values, 'draft').categoryMode);
});

//=============================================================================

test('custom category is required only in custom category mode', () => {
  const missingCustomCategory = validateProductRequestForm(
    createDraftValues({
      categoryMode: 'custom',
      categoryId: '',
      customCategory: '   ',
    }),
    'draft'
  );

  const catalogCategory = validateProductRequestForm(
    createDraftValues({ customCategory: '' }),
    'draft'
  );

  assert.equal(missingCustomCategory.customCategory, undefined);

  assert.ok(
    validateProductRequestForm(
      createDraftValues({
        categoryMode: 'custom',
        categoryId: '',
        customCategory: '',
      }),
      'moderation'
    ).customCategory
  );

  assert.equal(catalogCategory.customCategory, undefined);
});

//=============================================================================

test('moderation validation requires the moderation essentials and product image', () => {
  assert.equal(isProductRequestSubmissionValid(createDraftValues()), false);

  assert.equal(
    isProductRequestSubmissionValid(createSubmissionValues(), {
      productImage: validImage,
    }),
    true
  );
});

//=============================================================================

test('optional characteristics may be omitted for moderation', () => {
  const values = createSubmissionValues({
    releaseForm: '',
    activeIngredients: '',
    activeIngredientCount: '',
  });

  const errors = validateProductRequestForm(values, 'moderation', {
    productImage: validImage,
  });

  assert.deepEqual(errors, {});

  assert.equal(
    isProductRequestSubmissionValid(values, { productImage: validImage }),
    true
  );
});

//=============================================================================

test('brand, series and manufacturer are required for moderation, not drafts', () => {
  const complete = createSubmissionValues();
  const requiredFields = ['brand', 'series', 'manufacturer'] as const;

  for (const field of requiredFields) {
    const values = { ...complete, [field]: '' };

    assert.equal(isProductRequestDraftValid(values), true, `${field} draft`);

    assert.ok(
      validateProductRequestForm(values, 'moderation', {
        productImage: validImage,
      })[field],
      `${field} moderation`
    );
  }

  const descriptions = ['Vitamin C: 500 mg', 'Calcium: 55 mg'];

  for (const value of descriptions) {
    assert.equal(
      validateProductRequestForm(
        { ...complete, activeIngredientCount: value },
        'moderation',
        { productImage: validImage }
      ).activeIngredientCount,
      undefined
    );
  }

  assert.equal(
    normalizeProductRequestForm(complete, 'new').activeIngredientCount,
    'Paracetamol: 500 mg per tablet'
  );
});

//=============================================================================

test('product draft normalization uses Latin initial capitals and uppercase article', () => {
  const normalized = normalizeProductRequestForm(
    createDraftValues({
      name: 'medicine',
      article: 'aa-11-pp',
      customCategory: 'test category',
      brand: 'healthcare',
      series: 'daily',
    }),
    'new'
  );

  assert.equal(normalized.name, 'Medicine');
  assert.equal(normalized.article, 'AA-11-PP');
  assert.equal(normalized.brand, 'Healthcare');
  assert.equal(normalized.series, 'Daily');

  assert.ok(
    validateProductRequestForm(createDraftValues({ name: 'Товар' }), 'draft')
      .name
  );

  assert.equal(PRODUCT_REQUEST_LIMITS.customCategoryMax, 100);
});

//=============================================================================

test('Latin product text input rejects Cyrillic and preserves spaces between words', () => {
  assert.equal(
    normalizeProductRequestLatinInput('medicine gloves'),
    'Medicine gloves'
  );

  assert.equal(normalizeProductRequestLatinInput('medicine '), 'Medicine ');

  assert.equal(
    normalizeProductRequestLatinInput('витаміни Vitamin C 500 mg'),
    'Vitamin C 500 mg'
  );

  assert.equal(normalizeProductRequestLatinInput('крем'), '');
  assert.equal(normalizeProductRequestArticleInput('aa-11-пп'), 'AA-11-');
  assert.equal(normalizeProductRequestArticleInput('aa 11'), 'AA 11');

  assert.equal(
    normalizeProductRequestLatinInput('calcium: 55 mg; vitamin C: 500 mg'),
    'Calcium: 55 mg; vitamin C: 500 mg'
  );
});

//=============================================================================

test('articles reject every kind of whitespace with a specific format error', () => {
  const draft = createDraftValues();

  for (const article of ['AA 11', ' AA-11', 'AA-11 ', 'AA\t11', 'AA\n11']) {
    assert.match(
      validateProductRequestForm({ ...draft, article }, 'draft').article ?? '',
      /without spaces/
    );

    assert.equal(isProductRequestDraftValid({ ...draft, article }), false);
  }

  assert.equal(
    validateProductRequestForm({ ...draft, article: 'AA-11_PP' }, 'draft')
      .article,
    undefined
  );
});

//=============================================================================

test('optional ingredient count enforces Latin-only text and 200 character limit', () => {
  const base = createSubmissionValues();

  assert.equal(
    validateProductRequestForm(
      { ...base, activeIngredientCount: 'Кальцій 55 мг' },
      'draft'
    ).activeIngredientCount !== undefined,
    true
  );

  assert.equal(
    validateProductRequestForm(
      { ...base, activeIngredientCount: 'A'.repeat(201) },
      'draft'
    ).activeIngredientCount !== undefined,
    true
  );

  for (const field of [
    'releaseForm',
    'activeIngredients',
    'activeIngredientCount',
  ] as const) {
    const values = { ...base, [field]: '' };

    assert.equal(
      validateProductRequestForm(values, 'moderation', {
        productImage: validImage,
      })[field],
      undefined
    );
  }
});

//=============================================================================

test('About product requires 100 characters when populated, but draft can be blank', () => {
  const valid = createSubmissionValues();
  const short = 'A'.repeat(PRODUCT_REQUEST_LIMITS.fullDescriptionMin - 1);
  const exact = 'A'.repeat(PRODUCT_REQUEST_LIMITS.fullDescriptionMin);

  assert.equal(
    validateProductRequestForm(createDraftValues(), 'draft').fullDescription,
    undefined
  );

  assert.equal(
    validateProductRequestForm({ ...valid, fullDescription: short }, 'draft')
      .fullDescription,
    PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fullDescriptionMin
  );

  assert.equal(
    validateProductRequestForm(
      { ...valid, fullDescription: short },
      'moderation',
      { productImage: validImage }
    ).fullDescription,
    PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fullDescriptionMin
  );

  assert.equal(
    validateProductRequestForm(
      { ...valid, fullDescription: exact },
      'moderation',
      { productImage: validImage }
    ).fullDescription,
    undefined
  );
});

//=============================================================================

test('request attachments share pharmacy document limits and formats', () => {
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

  assert.deepEqual(
    PRODUCT_REQUEST_ATTACHMENT_RULES.extensions,
    PHARMACY_DOCUMENT_RULES.extensions
  );
});

//=============================================================================

test('full description validation accepts rich-text markdown controls', () => {
  const values = createSubmissionValues({
    fullDescription:
      '# Heading 1\n\n## Heading 2\n\n### Heading 3\n\n**Bold** and *italic* text.\n\n- Bullet item\n\n1. Numbered item\n\n[Product guide](https://example.com/help?q=device&source=pharmacy)',
  });

  assert.equal(
    isProductRequestSubmissionValid(values, { productImage: validImage }),
    true
  );
});

//=============================================================================

test('product image validation checks MIME, extension and size', () => {
  assert.equal(validateProductRequestImageFile(validImage), '');

  assert.notEqual(
    validateProductRequestImageFile({ ...validImage, size: 0 }),
    ''
  );

  assert.notEqual(
    validateProductRequestImageFile({
      name: 'product.gif',
      type: 'image/gif',
      size: 100,
    }),
    ''
  );

  assert.notEqual(
    validateProductRequestImageFile({
      name: 'product.gif',
      type: 'image/png',
      size: 100,
    }),
    ''
  );

  assert.notEqual(
    validateProductRequestImageFile({
      ...validImage,
      size: PRODUCT_REQUEST_IMAGE_RULES.maxSizeBytes + 1,
    }),
    ''
  );
});

//=============================================================================

test('additional file validation checks count, MIME, size and data URL', () => {
  const validFile = {
    name: 'instruction.pdf',
    type: 'application/pdf',
    size: 1,
    dataUrl: 'data:application/pdf;base64,AA==',
  } as const;

  assert.equal(validateProductRequestAdditionalFiles([validFile]), '');

  assert.notEqual(
    validateProductRequestAdditionalFiles([{ ...validFile, size: 0 }]),
    ''
  );

  assert.notEqual(
    validateProductRequestAdditionalFiles(
      [{ ...validFile, dataUrl: undefined }],
      { requireDataUrl: true }
    ),
    ''
  );

  assert.notEqual(
    validateProductRequestAdditionalFiles(
      Array.from(
        { length: PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles + 1 },
        () => validFile
      )
    ),
    ''
  );

  assert.notEqual(
    validateProductRequestAdditionalFiles([
      { name: 'archive.zip', type: 'application/zip', size: 100 },
    ]),
    ''
  );

  assert.notEqual(
    validateProductRequestAdditionalFiles([
      {
        ...validFile,
        size: PRODUCT_REQUEST_ATTACHMENT_RULES.maxSizeBytes + 1,
      },
    ]),
    ''
  );

  assert.notEqual(
    validateProductRequestAdditionalFiles([
      { ...validFile, dataUrl: 'data:image/png;base64,AA==' },
    ]),
    ''
  );

  assert.notEqual(
    validateProductRequestAdditionalFiles([{ ...validFile, size: 2 }]),
    ''
  );
});

//=============================================================================

test('normalization trims values, uppercases article and removes empty optional fields', () => {
  const payload = normalizeProductRequestForm(
    createSubmissionValues({
      article: ' med-001 ',
      customCategory: '  Not used  ',
      fullDescription: '  Complete English description.  ',
      pharmacyComment: '   ',
    }),
    'new',
    { productImage: validImage }
  );

  assert.equal(payload.article, 'MED-001');
  assert.equal(payload.categoryMode, 'catalog');
  assert.equal(payload.categoryId, '507f1f77bcf86cd799439011');
  assert.equal(payload.customCategory, undefined);
  assert.equal(payload.fullDescription, 'Complete English description.');
  assert.equal(payload.pharmacyComment, undefined);
});

//=============================================================================

test('normalization keeps custom category separate from catalog category ids', () => {
  const payload = normalizeProductRequestForm(
    createDraftValues({
      categoryMode: 'custom',
      categoryId: '',
      customCategory: '  Veterinary care  ',
    }),
    'new'
  );

  assert.equal(payload.categoryMode, 'custom');
  assert.equal(payload.categoryId, undefined);
  assert.equal(payload.customCategory, 'Veterinary care');
});

//=============================================================================

test('file metadata infers MIME and preserves actual file data', () => {
  const file = toProductRequestFileMetadata({
    name: 'instruction.pdf',
    type: '',
    size: 1,
    dataUrl: 'data:application/pdf;base64,AA==',
  });

  assert.equal(file.type, 'application/pdf');
  assert.equal(file.dataUrl, 'data:application/pdf;base64,AA==');
});

//=============================================================================

test('persisted product request attachment references need no inline Base64', () => {
  const documentId = '507f1f77bcf86cd799439011';

  const file = {
    documentId,
    name: 'support.pdf',
    type: 'application/pdf',
    size: 2048,
  };

  assert.equal(
    validateProductRequestAdditionalFiles([file], { requireDataUrl: true }),
    ''
  );

  assert.deepEqual(toProductRequestFileMetadata(file), file);

  assert.notEqual(
    validateProductRequestAdditionalFiles(
      [
        {
          name: file.name,
          type: file.type,
          size: file.size,
        },
      ],
      { requireDataUrl: true }
    ),
    ''
  );
});
