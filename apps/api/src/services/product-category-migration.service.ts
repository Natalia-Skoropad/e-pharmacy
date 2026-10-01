import { Types, type Connection } from 'mongoose';

import {
  LEGACY_CUSTOM_PRODUCT_REQUEST_CATEGORY,
  PRODUCT_CATEGORY_SEED_DEFINITIONS,
} from '../constants/product-category';

import { Product } from '../models/product.model';
import { ProductCategory } from '../models/productCategory.model';
import { ProductRequest } from '../models/productRequest.model';
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

export type ProductCategoryRelationMigrationResult = Readonly<{
  seededCreatedCount: number;
  migratedProducts: number;
  migratedProductRequests: number;
  migratedOrderSnapshots: number;
  legacyCustomProductRequests: number;
  categorySlugs: readonly string[];
}>;

type PersistedCategoryRow = Readonly<{
  _id: Types.ObjectId;
  name: string;
  slug: string;
}>;

type RelationMigrationPlan = Readonly<{
  productWrites: Array<Record<string, unknown>>;
  productRequestWrites: Array<Record<string, unknown>>;
  orderWrites: Array<Record<string, unknown>>;
  migratedOrderSnapshots: number;
  legacyCustomProductRequests: number;
  categorySlugs: string[];
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

function requireLegacyCategory(
  value: unknown,
  sourceLabel: string,
  allowCustomRequest: boolean
): LegacyProductCategoryResolution {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${sourceLabel} has a missing or invalid legacy category.`);
  }

  const resolution = resolveLegacyProductCategory(value);

  if (resolution.kind === 'unsupported') {
    throw new Error(
      `${sourceLabel} contains unsupported legacy product category "${resolution.value}".`
    );
  }

  if (resolution.kind === 'custom_request' && !allowCustomRequest) {
    throw new Error(
      `${sourceLabel} contains legacy category "other". Other is not a ProductCategory and product records must be corrected before relation migration.`
    );
  }

  return resolution;
}

//===============================================================

function getCategoryByIdOrThrow(
  categoryById: ReadonlyMap<string, PersistedCategoryRow>,
  categoryId: unknown,
  sourceLabel: string
): PersistedCategoryRow {
  const category = categoryById.get(String(categoryId ?? ''));

  if (!category) {
    throw new Error(`${sourceLabel} references an unknown ProductCategory.`);
  }

  return category;
}

//===============================================================

function getCategoryBySlugOrThrow(
  categoryBySlug: ReadonlyMap<string, PersistedCategoryRow>,
  slug: string,
  sourceLabel: string
): PersistedCategoryRow {
  const category = categoryBySlug.get(slug);

  if (!category) {
    throw new Error(
      `${sourceLabel} resolves to ProductCategory slug "${slug}", but that category is not persisted.`
    );
  }

  return category;
}

//===============================================================

async function buildRelationMigrationPlan(
  db: NonNullable<Connection['db']>
): Promise<RelationMigrationPlan> {
  const categoryRows = await ProductCategory.find({})
    .select('_id name slug')
    .lean<PersistedCategoryRow[]>();

  const categoryById = new Map(
    categoryRows.map((category) => [String(category._id), category])
  );
  const categoryBySlug = new Map(
    categoryRows.map((category) => [category.slug, category])
  );

  const productWrites: Array<Record<string, unknown>> = [];
  const productRequestWrites: Array<Record<string, unknown>> = [];
  const orderWrites: Array<Record<string, unknown>> = [];
  const productCategoryByProductId = new Map<string, PersistedCategoryRow>();
  const usedCategorySlugs = new Set<string>();
  let migratedOrderSnapshots = 0;
  let legacyCustomProductRequests = 0;

  const products = await db
    .collection('products')
    .find({}, { projection: { _id: 1, category: 1, categoryId: 1 } })
    .toArray();

  for (const product of products) {
    const sourceLabel = `Product ${String(product._id)}`;
    const hasLegacyCategory = typeof product.category === 'string';
    let category: PersistedCategoryRow;

    if (hasLegacyCategory) {
      const resolution = requireLegacyCategory(
        product.category,
        sourceLabel,
        false
      );

      if (resolution.kind !== 'category') {
        throw new Error(`${sourceLabel} has an invalid product category.`);
      }

      category = getCategoryBySlugOrThrow(
        categoryBySlug,
        resolution.slug,
        sourceLabel
      );

      if (
        product.categoryId &&
        String(product.categoryId) !== String(category._id)
      ) {
        throw new Error(
          `${sourceLabel} has conflicting legacy category and categoryId values.`
        );
      }
    } else {
      category = getCategoryByIdOrThrow(
        categoryById,
        product.categoryId,
        sourceLabel
      );
    }

    productCategoryByProductId.set(String(product._id), category);
    usedCategorySlugs.add(category.slug);

    if (hasLegacyCategory || !product.categoryId) {
      productWrites.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: { categoryId: category._id },
            $unset: { category: '' },
          },
        },
      });
    }
  }

  const productRequests = await db
    .collection('productrequests')
    .find(
      {},
      {
        projection: {
          _id: 1,
          category: 1,
          categoryMode: 1,
          categoryId: 1,
          customCategory: 1,
          productId: 1,
        },
      }
    )
    .toArray();

  for (const request of productRequests) {
    const sourceLabel = `ProductRequest ${String(request._id)}`;
    const hasLegacyCategory = typeof request.category === 'string';
    let categoryMode = request.categoryMode as string | undefined;
    let categoryId = request.categoryId as Types.ObjectId | undefined;
    let relationChanged = hasLegacyCategory || !request.categoryMode;

    if (hasLegacyCategory) {
      const resolution = requireLegacyCategory(
        request.category,
        sourceLabel,
        true
      );

      if (resolution.kind === 'custom_request') {
        if (
          typeof request.customCategory !== 'string' ||
          !request.customCategory.trim()
        ) {
          throw new Error(
            `${sourceLabel} uses legacy "other" without a customCategory.`
          );
        }

        if (categoryMode && categoryMode !== 'custom') {
          throw new Error(
            `${sourceLabel} has conflicting legacy category and categoryMode values.`
          );
        }

        categoryMode = 'custom';
        legacyCustomProductRequests += 1;
      } else if (resolution.kind === 'category') {
        const category = getCategoryBySlugOrThrow(
          categoryBySlug,
          resolution.slug,
          sourceLabel
        );

        if (categoryMode && categoryMode !== 'catalog') {
          throw new Error(
            `${sourceLabel} has conflicting legacy category and categoryMode values.`
          );
        }

        if (categoryId && String(categoryId) !== String(category._id)) {
          throw new Error(
            `${sourceLabel} has conflicting legacy category and categoryId values.`
          );
        }

        categoryMode = 'catalog';
        categoryId = category._id;
        usedCategorySlugs.add(category.slug);
      }
    }

    if (categoryMode !== 'catalog' && categoryMode !== 'custom') {
      throw new Error(`${sourceLabel} has a missing or invalid categoryMode.`);
    }

    const linkedProductCategory = request.productId
      ? productCategoryByProductId.get(String(request.productId))
      : undefined;

    if (request.productId && !linkedProductCategory) {
      throw new Error(`${sourceLabel} references an unknown Product.`);
    }

    if (categoryMode === 'catalog') {
      const category = getCategoryByIdOrThrow(
        categoryById,
        categoryId,
        sourceLabel
      );

      if (
        linkedProductCategory &&
        String(linkedProductCategory._id) !== String(category._id)
      ) {
        throw new Error(
          `${sourceLabel} category does not match its linked Product category.`
        );
      }

      usedCategorySlugs.add(category.slug);
    } else {
      if (
        typeof request.customCategory !== 'string' ||
        !request.customCategory.trim()
      ) {
        throw new Error(`${sourceLabel} custom category metadata is missing.`);
      }

      if (!categoryId && linkedProductCategory) {
        categoryId = linkedProductCategory._id;
        relationChanged = true;
      }

      if (categoryId) {
        const category = getCategoryByIdOrThrow(
          categoryById,
          categoryId,
          sourceLabel
        );

        if (
          linkedProductCategory &&
          String(linkedProductCategory._id) !== String(category._id)
        ) {
          throw new Error(
            `${sourceLabel} assigned category does not match its linked Product category.`
          );
        }

        usedCategorySlugs.add(category.slug);
      }
    }

    if (relationChanged) {
      productRequestWrites.push({
        updateOne: {
          filter: { _id: request._id },
          update: {
            $set: {
              categoryMode,
              ...(categoryId ? { categoryId } : {}),
            },
            $unset: {
              category: '',
              ...(categoryMode === 'custom' && !categoryId
                ? { categoryId: '' }
                : {}),
            },
          },
        },
      });
    }
  }

  const orders = await db
    .collection('orders')
    .find({}, { projection: { _id: 1, items: 1 } })
    .toArray();

  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : [];
    let orderChanged = false;

    const nextItems = items.map((item: Record<string, unknown>, itemIndex) => {
      const snapshot =
        item.productSnapshot && typeof item.productSnapshot === 'object'
          ? (item.productSnapshot as Record<string, unknown>)
          : null;

      if (!snapshot) return item;

      const sourceLabel = `Order ${String(order._id)} item ${itemIndex + 1}`;
      const hasLegacyCategory = typeof snapshot.category === 'string';
      const hasAnyRelationSnapshot = Boolean(
        snapshot.categoryId ||
        snapshot.categoryNameSnapshot ||
        snapshot.categorySlugSnapshot
      );

      if (!hasLegacyCategory && !hasAnyRelationSnapshot) return item;

      let categoryId = snapshot.categoryId as Types.ObjectId | undefined;
      let categoryName =
        typeof snapshot.categoryNameSnapshot === 'string'
          ? snapshot.categoryNameSnapshot
          : undefined;
      let categorySlug =
        typeof snapshot.categorySlugSnapshot === 'string'
          ? snapshot.categorySlugSnapshot
          : undefined;

      if (hasLegacyCategory) {
        const resolution = requireLegacyCategory(
          snapshot.category,
          sourceLabel,
          false
        );

        if (resolution.kind !== 'category') {
          throw new Error(`${sourceLabel} has an invalid category snapshot.`);
        }

        const category = getCategoryBySlugOrThrow(
          categoryBySlug,
          resolution.slug,
          sourceLabel
        );

        if (categoryId && String(categoryId) !== String(category._id)) {
          throw new Error(
            `${sourceLabel} has conflicting legacy and relation category snapshots.`
          );
        }

        categoryId = category._id;
        categoryName = category.name;
        categorySlug = category.slug;
      } else if (categoryId) {
        const persisted = getCategoryByIdOrThrow(
          categoryById,
          categoryId,
          sourceLabel
        );
        categoryName ??= persisted.name;
        categorySlug ??= persisted.slug;
      } else if (categorySlug) {
        const persisted = getCategoryBySlugOrThrow(
          categoryBySlug,
          categorySlug,
          sourceLabel
        );
        categoryId = persisted._id;
        categoryName ??= persisted.name;
      }

      if (!categoryId || !categoryName?.trim() || !categorySlug?.trim()) {
        throw new Error(`${sourceLabel} has a partial category snapshot.`);
      }

      usedCategorySlugs.add(categorySlug);

      const { category: _legacyCategory, ...snapshotWithoutLegacy } = snapshot;
      void _legacyCategory;

      const nextSnapshot = {
        ...snapshotWithoutLegacy,
        categoryId,
        categoryNameSnapshot: categoryName,
        categorySlugSnapshot: categorySlug,
      };

      const changed =
        hasLegacyCategory ||
        String(snapshot.categoryId ?? '') !== String(categoryId) ||
        snapshot.categoryNameSnapshot !== categoryName ||
        snapshot.categorySlugSnapshot !== categorySlug;

      if (!changed) return item;

      orderChanged = true;
      migratedOrderSnapshots += 1;

      return {
        ...item,
        productSnapshot: nextSnapshot,
      };
    });

    if (orderChanged) {
      orderWrites.push({
        updateOne: {
          filter: { _id: order._id },
          update: { $set: { items: nextItems } },
        },
      });
    }
  }

  return {
    productWrites,
    productRequestWrites,
    orderWrites,
    migratedOrderSnapshots,
    legacyCustomProductRequests,
    categorySlugs: [...usedCategorySlugs].sort(),
  };
}

//===============================================================

/**
 * Stage 11.2 compatibility preflight. Kept for the standalone preparation
 * command and tests; Stage 11.3 uses migrateProductCategoryRelations below.
 */
export async function prepareProductCategoryMigration(
  db: NonNullable<Connection['db']>
): Promise<ProductCategoryMigrationPreparationResult> {
  const bootstrap = await ensureInitialProductCategories();
  const plan = await buildRelationMigrationPlan(db);

  return {
    seededCreatedCount: bootstrap.createdCount,
    categorySlugs: plan.categorySlugs,
    legacyCustomProductRequests: plan.legacyCustomProductRequests,
  };
}

//===============================================================

/**
 * Stage 11.3 category relation migration.
 *
 * The complete migration plan is validated before relation writes start. The
 * writes themselves are idempotent, so rerunning after an interrupted deploy
 * safely continues from the persisted relation fields.
 */
export async function migrateProductCategoryRelations(
  db: NonNullable<Connection['db']>
): Promise<ProductCategoryRelationMigrationResult> {
  const bootstrap = await ensureInitialProductCategories();
  const plan = await buildRelationMigrationPlan(db);

  if (plan.productWrites.length) {
    const products = db.collection('products');
    await products.bulkWrite(
      plan.productWrites as unknown as Parameters<typeof products.bulkWrite>[0]
    );
  }

  if (plan.productRequestWrites.length) {
    const productRequests = db.collection('productrequests');
    await productRequests.bulkWrite(
      plan.productRequestWrites as unknown as Parameters<
        typeof productRequests.bulkWrite
      >[0]
    );
  }

  if (plan.orderWrites.length) {
    const orders = db.collection('orders');
    await orders.bulkWrite(
      plan.orderWrites as unknown as Parameters<typeof orders.bulkWrite>[0]
    );
  }

  // Drop legacy category indexes and materialize the relation indexes declared
  // by the Stage 11.3 models only after data is compatible with those models.
  await Product.syncIndexes();
  await ProductRequest.syncIndexes();

  return {
    seededCreatedCount: bootstrap.createdCount,
    migratedProducts: plan.productWrites.length,
    migratedProductRequests: plan.productRequestWrites.length,
    migratedOrderSnapshots: plan.migratedOrderSnapshots,
    legacyCustomProductRequests: plan.legacyCustomProductRequests,
    categorySlugs: plan.categorySlugs,
  };
}
