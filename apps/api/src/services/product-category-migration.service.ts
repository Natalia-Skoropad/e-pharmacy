import type { Connection } from 'mongoose';

import {
  LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY,
  PRODUCT_CATEGORY_SEED_DEFINITIONS,
} from '../constants/product-category';

import { ProductCategory } from '../models/productCategory.model';
import { ensureInitialProductCategories } from './product-category-bootstrap.service';

//===============================================================

const LEGACY_CATEGORY_ALIASES = new Map<string, string>();

for (const definition of PRODUCT_CATEGORY_SEED_DEFINITIONS) {
  LEGACY_CATEGORY_ALIASES.set(definition.slug, definition.slug);
  LEGACY_CATEGORY_ALIASES.set(definition.name.toLowerCase(), definition.slug);
}

// Historical pre-snake_case value handled by the older domain migration.
LEGACY_CATEGORY_ALIASES.set('medical-devices', 'medical_devices');

//===============================================================

export type LegacyProductCategoryResolution =
  | Readonly<{ kind: 'category'; slug: string }>
  | Readonly<{ kind: 'custom_request' }>
  | Readonly<{ kind: 'unsupported'; value: string }>;

export type ProductCategoryMigrationPreparationResult = Readonly<{
  seededCreatedCount: number;
  categorySlugs: readonly string[];
  legacyCustomProductRequests: number;
}>;

//===============================================================

export function resolveLegacyProductCategory(
  value: string
): LegacyProductCategoryResolution {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');

  if (normalized === LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY) {
    return { kind: 'custom_request' };
  }

  const slug = LEGACY_CATEGORY_ALIASES.get(normalized);
  if (slug) return { kind: 'category', slug };

  return { kind: 'unsupported', value };
}

//===============================================================

function collectCategorySlugs(
  values: readonly string[],
  sourceLabel: string,
  allowCustomRequest: boolean
): Set<string> {
  const slugs = new Set<string>();

  for (const value of values) {
    const resolution = resolveLegacyProductCategory(value);

    if (resolution.kind === 'category') {
      slugs.add(resolution.slug);
      continue;
    }

    if (resolution.kind === 'custom_request' && allowCustomRequest) {
      continue;
    }

    if (resolution.kind === 'custom_request') {
      throw new Error(
        `${sourceLabel} contains legacy category "other". Other is not a ProductCategory and product records must be corrected before relation migration.`
      );
    }

    throw new Error(
      `${sourceLabel} contains unsupported legacy product category "${resolution.value}".`
    );
  }

  return slugs;
}

//===============================================================

/**
 * Stage 11.2 migration preflight.
 *
 * It materializes the DB category records and validates every legacy string,
 * but intentionally does not write categoryId into Product/ProductRequest yet;
 * that relation change belongs to Stage 11.3.
 */
export async function prepareProductCategoryMigration(
  db: NonNullable<Connection['db']>
): Promise<ProductCategoryMigrationPreparationResult> {
  const bootstrap = await ensureInitialProductCategories();
  const products = db.collection('products');
  const productRequests = db.collection('productrequests');

  const [
    productValues,
    productRequestValues,
    invalidProductCategories,
    invalidProductRequestCategories,
  ] = await Promise.all([
    products.distinct('category', { category: { $type: 'string' } }),
    productRequests.distinct('category', { category: { $type: 'string' } }),

    products.countDocuments({
      $expr: { $ne: [{ $type: '$category' }, 'string'] },
    }),

    productRequests.countDocuments({
      $expr: { $ne: [{ $type: '$category' }, 'string'] },
    }),
  ]);

  if (invalidProductCategories > 0) {
    throw new Error(
      `${invalidProductCategories} Product record(s) have a missing or non-string legacy category.`
    );
  }

  if (invalidProductRequestCategories > 0) {
    throw new Error(
      `${invalidProductRequestCategories} ProductRequest record(s) have a missing or non-string legacy category.`
    );
  }

  const productSlugs = collectCategorySlugs(
    productValues.filter((value): value is string => typeof value === 'string'),
    'Product collection',
    false
  );

  const requestSlugs = collectCategorySlugs(
    productRequestValues.filter(
      (value): value is string => typeof value === 'string'
    ),
    'ProductRequest collection',
    true
  );

  const invalidCustomRequests = await productRequests.countDocuments({
    category: LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY,
    $or: [
      { customCategory: { $exists: false } },
      { customCategory: null },
      { customCategory: '' },
      { customCategory: /^\s*$/ },
    ],
  });

  if (invalidCustomRequests > 0) {
    throw new Error(
      `${invalidCustomRequests} legacy ProductRequest record(s) use "other" without a customCategory. Fix them before relation migration.`
    );
  }

  const categorySlugs = [...new Set([...productSlugs, ...requestSlugs])].sort();

  const expectedSeedSlugs = new Set<string>(
    PRODUCT_CATEGORY_SEED_DEFINITIONS.map((definition) => definition.slug)
  );

  for (const slug of categorySlugs) {
    if (!expectedSeedSlugs.has(slug)) {
      throw new Error(
        `Legacy product category "${slug}" has no Stage 11.2 seed definition.`
      );
    }
  }

  const persistedSlugs = await ProductCategory.distinct('slug', {
    slug: { $in: categorySlugs },
  });

  const persistedSlugSet = new Set(persistedSlugs);
  const missingSlugs = categorySlugs.filter(
    (slug) => !persistedSlugSet.has(slug)
  );

  if (missingSlugs.length > 0) {
    throw new Error(
      `ProductCategory migration preflight is missing persisted categories: ${missingSlugs.join(', ')}.`
    );
  }

  const legacyCustomProductRequests = await productRequests.countDocuments({
    category: LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY,
  });

  return {
    seededCreatedCount: bootstrap.createdCount,
    categorySlugs,
    legacyCustomProductRequests,
  };
}
