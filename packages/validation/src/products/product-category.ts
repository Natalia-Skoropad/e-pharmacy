import type { ProductCategory } from '@e-pharmacy/types/products';
import type { ProductCategorySnapshot } from '@e-pharmacy/types/reference-data';

import { isProductCategorySlug } from '../reference-data';

//===================================================================

function hasCategoryShape(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    isProductCategorySlug(candidate.slug)
  );
}

//===================================================================

export function isProductCategory(value: unknown): value is ProductCategory {
  if (!hasCategoryShape(value)) return false;

  return typeof value.id === 'string' && value.id.trim().length > 0;
}

//===================================================================

export function isProductCategorySnapshot(
  value: unknown
): value is ProductCategorySnapshot {
  if (!hasCategoryShape(value)) return false;

  return (
    value.id === undefined ||
    (typeof value.id === 'string' && value.id.trim().length > 0)
  );
}
