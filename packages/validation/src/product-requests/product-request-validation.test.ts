import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_INITIAL_VALUES,
  PRODUCT_REQUEST_LIMITS,
  isProductRequestDraftValid,
  isProductRequestSubmissionValid,
  normalizeProductRequestForm,
  toProductRequestFileMetadata,
  validateProductRequestAdditionalFiles,
  validateProductRequestForm,
  validateProductRequestImageFile,
  type ProductRequestFormValues,
} from './index';

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
  ['manufacturer', PRODUCT_REQUEST_LIMITS.manufacturerMax],
  ['countryOfOrigin', PRODUCT_REQUEST_LIMITS.countryOfOriginMax],
  ['dosage', PRODUCT_REQUEST_LIMITS.dosageMax],
  ['packageSize', PRODUCT_REQUEST_LIMITS.packageSizeMax],
  ['form', PRODUCT_REQUEST_LIMITS.formMax],
  ['activeSubstance', PRODUCT_REQUEST_LIMITS.activeSubstanceMax],
  ['prescriptionType', PRODUCT_REQUEST_LIMITS.prescriptionTypeMax],
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
    activeIngredientCount: '1',
    countryOfOrigin: 'United Kingdom',
    dosage: '500 mg',
    packageSize: '20 tablets',
    form: 'Tablets',
    activeSubstance: 'Paracetamol',
    prescriptionType: 'non_prescription',
    fullDescription: 'Complete product description in English.',
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
  const payload = normalizeProductRequestForm(values, 'draft');

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

test('legacy Product data fields remain optional for moderation', () => {
  const values = createSubmissionValues({
    dosage: '',
    packageSize: '',
    form: '',
    activeSubstance: '',
    prescriptionType: '',
  });

  const errors = validateProductRequestForm(values, 'moderation', {
    productImage: validImage,
  });

  assert.equal(errors.dosage, undefined);
  assert.equal(errors.packageSize, undefined);
  assert.equal(errors.form, undefined);
  assert.equal(errors.activeSubstance, undefined);
  assert.equal(errors.prescriptionType, undefined);

  assert.equal(
    isProductRequestSubmissionValid(values, { productImage: validImage }),
    true
  );
});

//=============================================================================

test('all six shared characteristics are required for moderation, not drafts', () => {
  const complete = createSubmissionValues();

  const requiredFields = [
    'brand',
    'series',
    'manufacturer',
    'releaseForm',
    'activeIngredients',
    'activeIngredientCount',
  ] as const;

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

  for (const value of ['0', '-1', '2.5', '100', 'abc']) {
    assert.ok(
      validateProductRequestForm(
        { ...complete, activeIngredientCount: value },
        'moderation',
        {
          productImage: validImage,
        }
      ).activeIngredientCount,
      `invalid count: ${value}`
    );
  }

  assert.equal(
    normalizeProductRequestForm(complete, 'new').activeIngredientCount,
    1
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
    'draft'
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
