import type { ProductRequestFormPayload } from '@e-pharmacy/types/product-requests';

import type {
  ProductRequestFormValues,
  ProductRequestPayloadFiles,
} from './product-request-types';

import { normalizeLatinTextInput, normalizeOptionalText } from '../shared';

//===================================================================

/**
 * For controlled product request short-text inputs: accept Latin text only,
 * preserve spaces while typing (including between words), and uppercase the
 * first Latin letter. Pasted Cyrillic and unsupported symbols are ignored.
 * Server-side validation remains authoritative for submitted payloads.
 */
export function normalizeProductRequestLatinInput(value: string): string {
  return normalizeLatinTextInput(value);
}

//===================================================================

/** Keep invalid spaces visible for the field-level article error, but
 * reject Cyrillic characters immediately and uppercase Latin letters. */
export function normalizeProductRequestArticleInput(value: string): string {
  return value.replace(/[^\x00-\x7F]/g, '').toUpperCase();
}

//===================================================================

// Capitalize initial Latin character without silently deleting other characters.
export function normalizeProductRequestTitle(value: string): string {
  const trimmed = value.trim();

  return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : '';
}

//===================================================================

export function normalizeProductRequestForm(
  values: ProductRequestFormValues,
  status: ProductRequestFormPayload['status'],
  files: ProductRequestPayloadFiles = {}
): ProductRequestFormPayload {
  return {
    status,
    name: normalizeProductRequestTitle(values.name),
    article: values.article.trim().toUpperCase(),
    categoryMode: values.categoryMode,

    categoryId:
      values.categoryMode === 'catalog'
        ? values.categoryId.trim() || undefined
        : undefined,

    customCategory:
      values.categoryMode === 'custom'
        ? normalizeProductRequestTitle(values.customCategory) || undefined
        : undefined,

    productImage: files.productImage,
    brand: normalizeProductRequestTitle(values.brand) || undefined,
    series: normalizeProductRequestTitle(values.series) || undefined,

    manufacturer:
      normalizeProductRequestTitle(values.manufacturer) || undefined,

    releaseForm: normalizeProductRequestTitle(values.releaseForm) || undefined,

    activeIngredients:
      normalizeProductRequestTitle(values.activeIngredients) || undefined,

    activeIngredientCount: normalizeOptionalText(values.activeIngredientCount),
    fullDescription: normalizeOptionalText(values.fullDescription),
    pharmacyComment: normalizeOptionalText(values.pharmacyComment),

    additionalFiles: files.additionalFiles?.length
      ? [...files.additionalFiles]
      : undefined,
  };
}
