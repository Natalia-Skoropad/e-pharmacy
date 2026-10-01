import {
  PRODUCT_CATEGORY_DEFAULT_COLOR,
  PRODUCT_CATEGORY_SEED_DEFINITIONS,
  normalizeProductCategoryNameKey,
} from '../constants/product-category';

import { ProductCategory } from '../models/productCategory.model';

//===============================================================

export type ProductCategoryBootstrapResult = Readonly<{
  createdCount: number;
  matchedCount: number;
}>;

//===============================================================

export function buildProductCategorySeedOperations() {
  return PRODUCT_CATEGORY_SEED_DEFINITIONS.map((definition) => {
    const normalizedName = normalizeProductCategoryNameKey(definition.name);

    return {
      updateOne: {
        filter: {
          slug: definition.slug,
          normalizedName,
        },
        update: {
          $setOnInsert: {
            ...definition,
            normalizedName,
            createdBy: null,
            updatedBy: null,
          },
        },
        upsert: true,
      },
    };
  });
}

//===============================================================

/**
 * Creates the fixed bootstrap records without overwriting an existing record.
 * Matching on both unique identity fields makes a conflicting partial match
 * fail through MongoDB's unique indexes instead of silently mutating data.
 */
export async function ensureInitialProductCategories(): Promise<ProductCategoryBootstrapResult> {
  await ProductCategory.createIndexes();

  const result = await ProductCategory.bulkWrite(
    buildProductCategorySeedOperations(),
    { ordered: true }
  );

  await ProductCategory.bulkWrite([
    ...PRODUCT_CATEGORY_SEED_DEFINITIONS.map((definition) => ({
      updateOne: {
        filter: {
          slug: definition.slug,
          $or: [{ color: { $exists: false } }, { color: null }],
        },
        update: { $set: { color: definition.color } },
      },
    })),
    {
      updateMany: {
        filter: { $or: [{ color: { $exists: false } }, { color: null }] },
        update: { $set: { color: PRODUCT_CATEGORY_DEFAULT_COLOR } },
      },
    },
  ]);

  return {
    createdCount: result.upsertedCount,
    matchedCount: result.matchedCount,
  };
}
