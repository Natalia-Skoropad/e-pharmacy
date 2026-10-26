import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { API_MESSAGES } from '../../constants/shared/messages';

import { Client } from '../../models/clients/client.model';
import { Product } from '../../models/catalog/product.model';
import { ProductCategory } from '../../models/catalog/productCategory.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';

import type {
  ProductFiltersQuery,
  PublicProductsQuery,
} from '../../schemas/catalog/product.schema';

import type { ProductFilterOptionsResponseDto } from '../../types/catalog/product';
import type { ProductCategoryReferenceDto } from '../../types/catalog/product-category';

import {
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
  serializeProductCategoryReference,
} from './product-category.service';

import { httpError } from '../../utils/http/httpError';

import { getProductsByScope, getProductDetailsByScope } from './product-shared';

import {
  getOfferSummaryByProductIds,
  serializeProductCardSummary,
} from './product-projections';

//===============================================================

async function getAvailableFilterCategories(
  query: ProductFiltersQuery
): Promise<ProductCategoryReferenceDto[]> {
  let categoryIds: Types.ObjectId[] | undefined;

  if (query.pharmacyId || typeof query.inStock === 'boolean') {
    const offerFilter: Record<string, unknown> = {};

    if (query.pharmacyId) offerFilter.pharmacyId = query.pharmacyId;

    if (query.inStock === false && !query.pharmacyId) {
      const availableProductIds = await ProductOffer.distinct('productId', {
        availableQuantity: { $gt: 0 },
      });

      categoryIds = await Product.distinct('categoryId', {
        _id: { $nin: availableProductIds },
        status: 'active',
      });
    } else {
      if (query.inStock === true) offerFilter.availableQuantity = { $gt: 0 };
      if (query.inStock === false) offerFilter.availableQuantity = 0;

      const productIds = await ProductOffer.distinct('productId', offerFilter);

      if (!productIds.length) return [];

      categoryIds = await Product.distinct('categoryId', {
        _id: { $in: productIds },
        status: 'active',
      });
    }
  }

  const categories = await ProductCategory.find({
    status: 'active',
    ...(categoryIds ? { _id: { $in: categoryIds } } : {}),
  })
    .sort({ sortOrder: 1, name: 1, _id: 1 })
    .select('_id name slug')
    .lean<Array<{ _id: Types.ObjectId; name: string; slug: string }>>();

  return categories.map(serializeProductCategoryReference);
}

//===============================================================

export async function getProductFiltersService(
  query: ProductFiltersQuery = {}
): Promise<ProductFilterOptionsResponseDto> {
  const categories = await getAvailableFilterCategories(query);

  return {
    categories: [
      { value: 'all', label: 'All categories' },

      ...categories.map((category) => ({
        value: category.slug,
        label: category.name,
      })),
    ],

    availability: [
      { value: 'all', label: 'All products' },
      { value: 'in-stock', label: 'Available in pharmacies' },
      { value: 'out-of-stock', label: 'Not available in pharmacies' },
    ],

    sort: [
      { value: 'newest', label: 'Newest first' },
      { value: 'rating-desc', label: 'Rating: highest first' },
      { value: 'rating-asc', label: 'Rating: lowest first' },
      { value: 'name-asc', label: 'Name: A to Z' },
      { value: 'name-desc', label: 'Name: Z to A' },
    ],
  };
}

//===============================================================

export async function getProductsService(
  query: PublicProductsQuery,
  userId?: string
) {
  return getProductsByScope(query, 'public', userId);
}

//===============================================================

export async function getFavoriteProductIdsService(userId: string) {
  const client = await Client.findOne({ userId })
    .select('favoriteProductIds')
    .lean<{ favoriteProductIds?: Types.ObjectId[] } | null>();

  return {
    ids: (client?.favoriteProductIds ?? []).map(String),
  };
}

//===============================================================

export async function getFavoriteProductsService(
  query: PublicProductsQuery,
  userId: string
) {
  const client = await Client.findOne({ userId })
    .select('favoriteProductIds favoritePharmacyIds')

    .lean<{
      favoriteProductIds?: Types.ObjectId[];
      favoritePharmacyIds?: Types.ObjectId[];
    } | null>();

  const favoriteProductIds = client?.favoriteProductIds ?? [];

  const filter = {
    _id: { $in: favoriteProductIds },
    status: 'active',
  };

  const sort: Record<string, 1 | -1> =
    query.sort === 'name-desc' ? { name: -1 } : { name: 1 };

  const skip = (query.page - 1) * query.perPage;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(query.perPage).lean(),
    Product.countDocuments(filter),
  ]);

  const summaryMap = await getOfferSummaryByProductIds(
    products.map((product) => product._id)
  );

  const categoryMap = await getProductCategoryReferenceMap(
    products.map((product) => product.categoryId)
  );

  const favoriteIds = new Set(favoriteProductIds.map(String));

  return {
    items: products.map((product) =>
      serializeProductCardSummary(
        product,
        getProductCategoryReferenceOrThrow(categoryMap, product.categoryId),
        summaryMap.get(String(product._id)),
        favoriteIds
      )
    ),

    page: total === 0 ? 1 : query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
    earliestCreatedAt: null,
  };
}

//===============================================================

export async function getProductDetailsService(
  productId: string,
  userId?: string
) {
  return getProductDetailsByScope(productId, userId, 'public');
}

//===============================================================

export async function setFavoriteProductService(
  productId: string,
  userId: string,
  isFavorite: boolean
) {
  const exists = await Product.exists({ _id: productId, status: 'active' });

  if (!exists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const result = await Client.updateOne(
    { userId },

    isFavorite
      ? { $addToSet: { favoriteProductIds: productId } }
      : { $pull: { favoriteProductIds: productId } }
  );

  if (result.matchedCount === 0) {
    throw httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.FORBIDDEN_ROLE);
  }

  return {
    isFavorite,

    message: isFavorite
      ? 'Product was added to favorites.'
      : 'Product was removed from favorites.',
  };
}
