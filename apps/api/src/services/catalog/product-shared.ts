import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/httpStatus';
import { API_MESSAGES } from '../../constants/messages';
import { Product } from '../../models/product.model';
import { ProductOffer } from '../../models/productOffer.model';
import type { ManagedProductsQuery } from '../../schemas/product.schema';

import {
  findProductCategoryBySlug,
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
} from './product-category.service';

import { httpError } from '../../utils/httpError';
import { getEndOfDay, getStartOfDay } from '../../utils/date-range';

import {
  createFlexibleSearchRegExp,
  createSafeRegExp,
} from '../../utils/regexp';

import type { ProductOfferVisibility } from './product-projections';

import {
  getClientFavorites,
  getOffersByProductIds,
  getOfferSummaryByProductIds,
  serializeProductCardSummary,
  serializeProductDetails,
} from './product-projections';

//===============================================================

type ProductsQuery = ManagedProductsQuery;

//===============================================================

function toObjectIdStrings(values: unknown[]): string[] {
  return values.map(String);
}

//===============================================================

function intersectStringLists(first: string[], second: string[]): string[] {
  const secondSet = new Set(second);

  return first.filter((item) => secondSet.has(item));
}

//===============================================================

function applyProductIdIncludeFilter(
  filter: Record<string, unknown>,
  productIds: unknown[]
): void {
  const ids = toObjectIdStrings(productIds);

  const current = filter._id as
    | { $in?: unknown[]; $nin?: unknown[] }
    | undefined;

  const currentIn = current?.$in ? toObjectIdStrings(current.$in) : undefined;

  filter._id = {
    ...(current ?? {}),

    $in: currentIn ? intersectStringLists(currentIn, ids) : ids,
  };
}

//===============================================================

function applyProductIdExcludeFilter(
  filter: Record<string, unknown>,
  productIds: unknown[]
): void {
  const ids = toObjectIdStrings(productIds);

  const current = filter._id as
    | { $in?: unknown[]; $nin?: unknown[] }
    | undefined;

  const currentNin = current?.$nin ? toObjectIdStrings(current.$nin) : [];

  filter._id = {
    ...(current ?? {}),

    $nin: [...new Set([...currentNin, ...ids])],
  };
}

//===============================================================

function createEmptyOwnProductStatistics() {
  return {
    inStock: { quantity: 0, amount: 0 },
    reserved: { quantity: 0, amount: 0 },
    available: { quantity: 0, amount: 0 },
    outOfStock: { quantity: 0 },
  };
}

//===============================================================

async function getOwnProductStatistics(pharmacyId: string) {
  const [row] = await ProductOffer.aggregate<{
    stockQuantity: number;
    stockValue: number;
    reservedQuantity: number;
    reservedValue: number;
    availableQuantity: number;
    availableValue: number;
    outOfStockProducts: number;
  }>([
    { $match: { pharmacyId: new Types.ObjectId(pharmacyId) } },

    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },

    { $unwind: '$product' },
    { $match: { 'product.status': { $in: ['active', 'blocked'] } } },

    {
      $group: {
        _id: null,
        stockQuantity: { $sum: '$totalQuantity' },
        stockValue: { $sum: { $multiply: ['$totalQuantity', '$price'] } },
        reservedQuantity: { $sum: '$reservedQuantity' },

        reservedValue: {
          $sum: { $multiply: ['$reservedQuantity', '$price'] },
        },

        availableQuantity: { $sum: '$availableQuantity' },

        availableValue: {
          $sum: { $multiply: ['$availableQuantity', '$price'] },
        },

        outOfStockProducts: {
          $sum: { $cond: [{ $eq: ['$totalQuantity', 0] }, 1, 0] },
        },
      },
    },
  ]);

  if (!row) return createEmptyOwnProductStatistics();

  return {
    inStock: { quantity: row.stockQuantity, amount: row.stockValue },
    reserved: { quantity: row.reservedQuantity, amount: row.reservedValue },

    available: {
      quantity: row.availableQuantity,
      amount: row.availableValue,
    },

    outOfStock: { quantity: row.outOfStockProducts },
  };
}

//===============================================================

export async function getProductsByScope(
  query: ProductsQuery,
  scope: 'public' | 'management',
  userId?: string,

  options: Readonly<{
    includeOffers?: boolean;
    offerVisibility?: ProductOfferVisibility;
  }> = {}
) {
  const filter: Record<string, unknown> = {};

  const tableStatusFilter =
    scope === 'public'
      ? 'active'
      : query.pharmacyId || query.includeBlocked
        ? { $in: ['active', 'blocked'] }
        : 'active';

  filter.status =
    scope === 'public' ? 'active' : (query.status ?? tableStatusFilter);

  const productTableScopeFilter: Record<string, unknown> = {
    status: tableStatusFilter,
  };

  const keyword = query.keyword?.trim();

  if (keyword) {
    filter.$or = [
      { name: createFlexibleSearchRegExp(keyword) },
      { article: createSafeRegExp(keyword) },
      { description: createFlexibleSearchRegExp(keyword) },
    ];
  }

  if (query.nameKeyword) {
    filter.name = createFlexibleSearchRegExp(query.nameKeyword);
  }

  if (query.articleKeyword) {
    filter.article = createSafeRegExp(query.articleKeyword);
  }

  if (query.category) {
    const category = await findProductCategoryBySlug(query.category, {
      activeOnly: scope === 'public',
    });

    filter.categoryId = category?._id ?? null;
  }

  if (!query.pharmacyId && (query.addedFrom || query.addedTo)) {
    filter.createdAt = {
      ...(query.addedFrom ? { $gte: getStartOfDay(query.addedFrom) } : {}),
      ...(query.addedTo ? { $lte: getEndOfDay(query.addedTo) } : {}),
    };
  }

  let allowedProductIds: Types.ObjectId[] | undefined;

  const offerFilter: Record<string, unknown> = {};

  if (query.pharmacyId) offerFilter.pharmacyId = query.pharmacyId;

  if (query.pharmacyId && (query.addedFrom || query.addedTo)) {
    offerFilter.createdAt = {
      ...(query.addedFrom ? { $gte: getStartOfDay(query.addedFrom) } : {}),
      ...(query.addedTo ? { $lte: getEndOfDay(query.addedTo) } : {}),
    };
  }

  if (
    typeof query.minPrice === 'number' ||
    typeof query.maxPrice === 'number'
  ) {
    offerFilter.price = {
      ...(typeof query.minPrice === 'number' ? { $gte: query.minPrice } : {}),
      ...(typeof query.maxPrice === 'number' ? { $lte: query.maxPrice } : {}),
    };
  }

  if (query.stock === 'in-stock') {
    offerFilter.totalQuantity = { $gt: 0 };
  }

  if (query.stock === 'available') {
    offerFilter.availableQuantity = { $gt: 0 };
  }

  if (query.stock === 'reserved') {
    offerFilter.reservedQuantity = { $gt: 0 };
  }

  if (query.stock === 'empty') {
    offerFilter.totalQuantity = 0;
  }

  if (!query.stock && query.inStock === true) {
    offerFilter.availableQuantity = { $gt: 0 };
  }

  if (!query.stock && query.inStock === false && !query.pharmacyId) {
    const availableProductIds = await ProductOffer.distinct('productId', {
      availableQuantity: { $gt: 0 },
    });

    applyProductIdExcludeFilter(filter, availableProductIds);
  } else {
    if (!query.stock && query.inStock === false) {
      offerFilter.availableQuantity = 0;
    }

    if (Object.keys(offerFilter).length) {
      allowedProductIds = await ProductOffer.distinct('productId', offerFilter);
      applyProductIdIncludeFilter(filter, allowedProductIds);
    }
  }

  if (query.addedToPharmacyId && typeof query.addedToMyPharmacy === 'boolean') {
    const pharmacyProductIds = await ProductOffer.distinct('productId', {
      pharmacyId: query.addedToPharmacyId,
    });

    if (query.addedToMyPharmacy) {
      applyProductIdIncludeFilter(filter, pharmacyProductIds);
    } else {
      applyProductIdExcludeFilter(filter, pharmacyProductIds);
    }
  }

  const sort: Record<string, 1 | -1> =
    query.sort === 'name-asc'
      ? { name: 1 }
      : query.sort === 'name-desc'
        ? { name: -1 }
        : query.sort === 'rating-asc'
          ? { rating: 1 }
          : query.sort === 'rating-desc'
            ? { rating: -1 }
            : { createdAt: -1 };

  const skip = (query.page - 1) * query.perPage;

  const earliestCreatedAtQuery = query.pharmacyId
    ? ProductOffer.findOne({ pharmacyId: query.pharmacyId })
        .sort({ createdAt: 1 })
        .select('createdAt')
        .lean<{ createdAt: Date } | null>()
    : Product.findOne(productTableScopeFilter)
        .sort({ createdAt: 1 })
        .select('createdAt')
        .lean<{ createdAt: Date } | null>();

  const [
    products,
    total,
    favorites,
    ownProductStatistics,
    earliestCreatedRecord,
  ] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(query.perPage).lean(),
    Product.countDocuments(filter),
    getClientFavorites(userId),

    query.pharmacyId
      ? getOwnProductStatistics(query.pharmacyId)
      : Promise.resolve(undefined),

    earliestCreatedAtQuery,
  ]);

  const productIds = products.map((product) => product._id);

  const categoryMap = await getProductCategoryReferenceMap(
    products.map((product) => product.categoryId)
  );

  const items = options.includeOffers
    ? await (async () => {
        const offerMap = await getOffersByProductIds(
          productIds,
          favorites.pharmacies,
          options.offerVisibility
        );

        return products.map((product) =>
          serializeProductDetails(
            product,
            getProductCategoryReferenceOrThrow(categoryMap, product.categoryId),
            offerMap.get(String(product._id)) ?? [],
            favorites.products
          )
        );
      })()
    : await (async () => {
        const summaryMap = await getOfferSummaryByProductIds(
          productIds,
          query.pharmacyId
        );

        return products.map((product) =>
          serializeProductCardSummary(
            product,
            getProductCategoryReferenceOrThrow(categoryMap, product.categoryId),
            summaryMap.get(String(product._id)),
            favorites.products
          )
        );
      })();

  if (query.sort === 'price-asc') items.sort((a, b) => a.price - b.price);
  if (query.sort === 'price-desc') items.sort((a, b) => b.price - a.price);

  return {
    items,
    page: total === 0 ? 1 : query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),

    earliestCreatedAt: earliestCreatedRecord
      ? earliestCreatedRecord.createdAt.toISOString().slice(0, 10)
      : null,

    ...(ownProductStatistics ? { ownProductStatistics } : {}),
  };
}

//===============================================================

export async function getProductDetailsByScope(
  productId: string,
  userId: string | undefined,
  scope: 'public' | 'management',
  offerVisibility: ProductOfferVisibility = { mode: 'public' }
) {
  const product = await Product.findOne({
    _id: productId,
    status: scope === 'public' ? 'active' : { $in: ['active', 'blocked'] },
  }).lean();

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const favorites = await getClientFavorites(userId);

  const offerMap = await getOffersByProductIds(
    [product._id],
    favorites.pharmacies,
    offerVisibility
  );

  const categoryMap = await getProductCategoryReferenceMap([
    product.categoryId,
  ]);

  return {
    product: serializeProductDetails(
      product,
      getProductCategoryReferenceOrThrow(categoryMap, product.categoryId),
      offerMap.get(String(product._id)) ?? [],
      favorites.products
    ),
  };
}
