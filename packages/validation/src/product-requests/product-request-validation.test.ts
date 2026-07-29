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
  'category'
>;

//=============================================================================

const FIELD_LIMIT_CASES: ReadonlyArray<
  readonly [ProductRequestTextField, number]
> = [
  ['name', PRODUCT_REQUEST_LIMITS.nameMax],
  ['article', PRODUCT_REQUEST_LIMITS.articleMax],
  ['customCategory', PRODUCT_REQUEST_LIMITS.customCategoryMax],
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
    ...overrides,
  };
}

//=============================================================================

function createSubmissionValues(
  overrides: Partial<ProductRequestFormValues> = {}
): ProductRequestFormValues {
  return createDraftValues({
    manufacturer: 'Pharmaco',
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

test('draft validation requires name and article', () => {
  assert.equal(
    isProductRequestDraftValid(PRODUCT_REQUEST_INITIAL_VALUES),
    false
  );

  assert.equal(isProductRequestDraftValid(createDraftValues()), true);
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

test('validation rejects an unsupported category', () => {
  const values = createDraftValues();
  Reflect.set(values, 'category', 'unsupported');

  assert.ok(validateProductRequestForm(values, 'draft').category);
});

//=============================================================================

test('custom category is required only for the other category', () => {
  const missingCustomCategory = validateProductRequestForm(
    createDraftValues({ category: 'other', customCategory: '   ' }),
    'draft'
  );

  const regularCategory = validateProductRequestForm(
    createDraftValues({ category: 'medicine', customCategory: '' }),
    'draft'
  );

  assert.ok(missingCustomCategory.customCategory);
  assert.equal(regularCategory.customCategory, undefined);
});

//=============================================================================

test('moderation validation requires complete data and product image', () => {
  assert.equal(isProductRequestSubmissionValid(createDraftValues()), false);

  assert.equal(
    isProductRequestSubmissionValid(createSubmissionValues(), {
      productImage: validImage,
    }),
    true
  );
});

//=============================================================================

test('product image validation checks MIME, extension and size', () => {
  assert.equal(validateProductRequestImageFile(validImage), '');

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
  assert.equal(payload.customCategory, undefined);
  assert.equal(payload.fullDescription, 'Complete English description.');
  assert.equal(payload.pharmacyComment, undefined);
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
