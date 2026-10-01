import type { ClientSession, Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { ProductCategory } from '../models/productCategory.model';
import type { ProductCategoryPersistenceEntity } from '../types/product-category';
import type { ProductCategoryReferenceDto } from '../types/product-category';
import { httpError } from '../utils/httpError';

//===============================================================

type ProductCategoryDocument = ProductCategoryPersistenceEntity & {
  _id: Types.ObjectId;
};

type ProductCategoryLookupOptions = Readonly<{
  activeOnly?: boolean;
  session?: ClientSession;
}>;

//===============================================================

export function serializeProductCategoryReference(
  category: Pick<ProductCategoryDocument, '_id' | 'name' | 'slug'>
): ProductCategoryReferenceDto {
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
  };
}

//===============================================================

export async function findProductCategoryById(
  categoryId: Types.ObjectId | string,
  options: ProductCategoryLookupOptions = {}
): Promise<ProductCategoryDocument | null> {
  const query = ProductCategory.findOne({
    _id: categoryId,
    ...(options.activeOnly ? { status: 'active' } : {}),
  }).lean<ProductCategoryDocument | null>();

  if (options.session) query.session(options.session);
  return query;
}

//===============================================================

export async function findProductCategoryBySlug(
  slug: string,
  options: ProductCategoryLookupOptions = {}
): Promise<ProductCategoryDocument | null> {
  const query = ProductCategory.findOne({
    slug,
    ...(options.activeOnly ? { status: 'active' } : {}),
  }).lean<ProductCategoryDocument | null>();

  if (options.session) query.session(options.session);
  return query;
}

//===============================================================

export async function requireProductCategoryById(
  categoryId: Types.ObjectId | string,
  options: ProductCategoryLookupOptions = {}
): Promise<ProductCategoryDocument> {
  const category = await findProductCategoryById(categoryId, options);

  if (!category) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Product category was not found or is unavailable.'
    );
  }

  return category;
}

//===============================================================

export async function getProductCategoryReferenceMap(
  categoryIds: readonly Types.ObjectId[],
  session?: ClientSession
): Promise<Map<string, ProductCategoryReferenceDto>> {
  const uniqueIds = [
    ...new Map(
      categoryIds.map((categoryId) => [String(categoryId), categoryId])
    ).values(),
  ];

  if (!uniqueIds.length) return new Map();

  const query = ProductCategory.find({ _id: { $in: uniqueIds } })
    .select('_id name slug')
    .lean<ProductCategoryDocument[]>();

  if (session) query.session(session);
  const categories = await query;

  return new Map(
    categories.map((category) => [
      String(category._id),
      serializeProductCategoryReference(category),
    ])
  );
}

//===============================================================

export function getProductCategoryReferenceOrThrow(
  categoryMap: ReadonlyMap<string, ProductCategoryReferenceDto>,
  categoryId: Types.ObjectId
): ProductCategoryReferenceDto {
  const category = categoryMap.get(String(categoryId));

  if (!category) {
    throw httpError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Product category relation is invalid.'
    );
  }

  return category;
}

//===============================================================

export async function getPublicProductCategoriesService(): Promise<
  ProductCategoryReferenceDto[]
> {
  const categories = await ProductCategory.find({ status: 'active' })
    .sort({ sortOrder: 1, name: 1, _id: 1 })
    .select('_id name slug')
    .lean<ProductCategoryDocument[]>();

  return categories.map(serializeProductCategoryReference);
}
