import { Types } from 'mongoose';

import {
  PRODUCT_CATEGORY_DEFAULT_COLOR,
  PRODUCT_CATEGORY_SEED_DEFINITIONS,
  type ProductCategoryKind,
  type ProductCategoryStatus,
} from '../../../constants/catalog/product-category';

import type {
  AdminProductCategoryDto,
  ProductCategoryUsageDto,
} from '../../../types/admin-settings';

import type { ProductCategoryPersistenceEntity } from '../../../types/product-category';

//===============================================================

export type LeanProductCategory = ProductCategoryPersistenceEntity & {
  _id: Types.ObjectId;
};

//===============================================================

export function serializeCategory(
  category: LeanProductCategory,
  usage: ProductCategoryUsageDto
): AdminProductCategoryDto {
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    status: category.status,
    kind: category.kind,
    sortOrder: category.sortOrder,
    color: category.color ?? PRODUCT_CATEGORY_DEFAULT_COLOR,

    icon:
      category.icon ??
      PRODUCT_CATEGORY_SEED_DEFINITIONS.find(
        (item) => item.slug === category.slug
      )?.icon ??
      'pill',

    usage,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

//===============================================================

export function buildCategoryAuditSnapshot(category: {
  name: string;
  slug: string;
  status: ProductCategoryStatus;
  kind: ProductCategoryKind;
  sortOrder: number;
  color: string;
  icon?: string;
}) {
  return {
    name: category.name,
    slug: category.slug,
    status: category.status,
    kind: category.kind,
    sortOrder: category.sortOrder,
    color: category.color ?? PRODUCT_CATEGORY_DEFAULT_COLOR,

    icon:
      category.icon ??
      PRODUCT_CATEGORY_SEED_DEFINITIONS.find(
        (item) => item.slug === category.slug
      )?.icon ??
      'pill',
  };
}
