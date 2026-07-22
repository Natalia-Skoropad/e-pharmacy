import type { ProductRequestFormPayload } from '@e-pharmacy/types/product-requests';

import type {
  ProductRequestFormValues,
  ProductRequestPayloadFiles,
} from './product-request-types';

//===================================================================

function normalizeOptionalText(value: string): string | undefined {
  const normalizedValue = value.trim();
  return normalizedValue || undefined;
}

//===================================================================

export function normalizeProductRequestForm(
  values: ProductRequestFormValues,
  status: ProductRequestFormPayload['status'],
  files: ProductRequestPayloadFiles = {}
): ProductRequestFormPayload {
  return {
    status,
    name: values.name.trim(),
    article: values.article.trim().toUpperCase(),
    category: values.category,

    customCategory:
      values.category === 'other'
        ? normalizeOptionalText(values.customCategory)
        : undefined,

    productImage: files.productImage,
    manufacturer: normalizeOptionalText(values.manufacturer),
    countryOfOrigin: normalizeOptionalText(values.countryOfOrigin),
    dosage: normalizeOptionalText(values.dosage),
    packageSize: normalizeOptionalText(values.packageSize),
    form: normalizeOptionalText(values.form),
    activeSubstance: normalizeOptionalText(values.activeSubstance),
    prescriptionType: normalizeOptionalText(values.prescriptionType),
    fullDescription: normalizeOptionalText(values.fullDescription),
    pharmacyComment: normalizeOptionalText(values.pharmacyComment),

    additionalFiles: files.additionalFiles?.length
      ? [...files.additionalFiles]
      : undefined,
  };
}
