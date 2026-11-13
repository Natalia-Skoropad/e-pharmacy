import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { API_MESSAGES } from '../../constants/shared/messages';

import { Product } from '../../models/catalog/product.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';

import type { ManagedProductsQuery } from '../../schemas/catalog/product.schema';

import {
  findProductCategoryBySlug,
  getProductCategoryReferenceMap,
  getProductCategoryReferenceOrThrow,
} from './product-category.service';

import { httpError } from '../../utils/http/httpError';

import {
  getBusinessCalendarDate,
  getEndOfBusinessDay,
  getStartOfBusinessDay,
} from '../../utils/dates/date-range';

import {
  createFlexibleSearchRegExp,
  createSafeRegExp,
} from '../../utils/validation/regexp';

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

async function getOwnProductStatistics(pharmacyIds: readonly string[]) {
  const [row] = await ProductOffer.aggregate<{
    stockQuantity: number;
    stockValue: number;
    reservedQuantity: number;
    reservedValue: number;
    availableQuantity: number;
    availableValue: number;
    outOfStockProducts: number;
  }>([
    {
      $match: {
        pharmacyId: { $in: pharmacyIds.map((id) => new Types.ObjectId(id)) },
      },
    },

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
    ownerSelectedProductIds?: Types.ObjectId[];
    ownedPharmacyIds?: string[];
  }> = {}
) {
  const filter: Record<string, unknown> = {};

  const tableStatusFilter =
    scope === 'public'
      ? 'active'
      : query.pharmacyId || query.includeBlocked || query.ownerProducts
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
      ...(Types.ObjectId.isValid(keyword)
        ? [{ _id: new Types.ObjectId(keyword) }]
        : []),

      { name: createFlexibleSearchRegExp(keyword) },
      { article: createSafeRegExp(keyword) },
      { description: createFlexibleSearchRegExp(keyword) },
    ];
  }

  if (query.catalogSearch) {
    filter.$or = [
      { name: createFlexibleSearchRegExp(query.catalogSearch) },
      { article: createSafeRegExp(query.catalogSearch) },
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

  // Keep the product predicates before adding offer/date constraints, so
  // calendar days can be computed from every eligible offer without pagination.
  const calendarProductFilter = { ...filter };

  if (query.productId && Types.ObjectId.isValid(query.productId)) {
    calendarProductFilter._id = new Types.ObjectId(query.productId);
  }

  if (
    !query.pharmacyId &&
    !options.ownedPharmacyIds &&
    (query.addedFrom || query.addedTo)
  ) {
    filter.createdAt = {
      ...(query.addedFrom
        ? { $gte: getStartOfBusinessDay(query.addedFrom) }
        : {}),

      ...(query.addedTo ? { $lte: getEndOfBusinessDay(query.addedTo) } : {}),
    };
  }

  let allowedProductIds: Types.ObjectId[] | undefined;

  const offerFilter: Record<string, unknown> = {};

  if (options.ownedPharmacyIds) {
    // This ownership allow-list is mandatory, including for stock/date filters.
    const ids = query.pharmacyId
      ? [query.pharmacyId]
      : options.ownedPharmacyIds;

    offerFilter.pharmacyId = { $in: ids.map((id) => new Types.ObjectId(id)) };

    const ownedProductIds = await ProductOffer.distinct('productId', {
      pharmacyId: offerFilter.pharmacyId,
    });

    applyProductIdIncludeFilter(filter, ownedProductIds);
  } else if (query.pharmacyId) offerFilter.pharmacyId = query.pharmacyId;

  if (
    (query.pharmacyId || options.ownedPharmacyIds) &&
    (query.addedFrom || query.addedTo) &&
    !(query.ownerProducts && options.ownedPharmacyIds && !query.pharmacyId)
  ) {
    offerFilter.createdAt = {
      ...(query.addedFrom
        ? { $gte: getStartOfBusinessDay(query.addedFrom) }
        : {}),

      ...(query.addedTo ? { $lte: getEndOfBusinessDay(query.addedTo) } : {}),
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

  if (
    options.ownerSelectedProductIds &&
    typeof query.addedToMyPharmacy === 'boolean'
  ) {
    if (query.addedToMyPharmacy)
      applyProductIdIncludeFilter(filter, options.ownerSelectedProductIds);
    else applyProductIdExcludeFilter(filter, options.ownerSelectedProductIds);
  }

  if (
    !options.ownerSelectedProductIds &&
    query.addedToPharmacyId &&
    typeof query.addedToMyPharmacy === 'boolean'
  ) {
    const pharmacyProductIds = await ProductOffer.distinct('productId', {
      pharmacyId: query.addedToPharmacyId,
    });

    if (query.addedToMyPharmacy) {
      applyProductIdIncludeFilter(filter, pharmacyProductIds);
    } else {
      applyProductIdExcludeFilter(filter, pharmacyProductIds);
    }
  }

  // For the owner-wide table the Added date is the first time the product
  // entered ANY owned pharmacy, not its Admin catalog creation time, nor its
  // latest synchronization to another pharmacy.
  const ownerFirstAdded =
    options.ownedPharmacyIds && query.ownerProducts
      ? await ProductOffer.aggregate<{ _id: Types.ObjectId; addedAt: Date }>([
          {
            $match: {
              pharmacyId: {
                $in: options.ownedPharmacyIds.map(
                  (id) => new Types.ObjectId(id)
                ),
              },
            },
          },
          { $group: { _id: '$productId', addedAt: { $min: '$createdAt' } } },
          { $sort: { addedAt: -1, _id: 1 } },
        ])
      : null;

  if (
    ownerFirstAdded &&
    !query.pharmacyId &&
    (query.addedFrom || query.addedTo)
  ) {
    applyProductIdIncludeFilter(
      filter,

      ownerFirstAdded
        .filter(
          ({ addedAt }) =>
            (!query.addedFrom ||
              addedAt >= getStartOfBusinessDay(query.addedFrom)) &&
            (!query.addedTo || addedAt <= getEndOfBusinessDay(query.addedTo))
        )
        .map(({ _id }) => _id)
    );
  }

  if (query.productId) {
    const existing = filter._id as Record<string, unknown> | undefined;

    filter._id = {
      ...(existing ?? {}),
      $eq: new Types.ObjectId(query.productId),
    };
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

  const calendarOfferFilter: Record<string, unknown> = { ...offerFilter };

  delete calendarOfferFilter.createdAt;

  const ownerCalendarQuery =
    ownerFirstAdded && !query.pharmacyId
      ? Product.find(calendarProductFilter)
          .select('_id')
          .lean()
          .then((products) => {
            const matching = new Set(products.map(({ _id }) => String(_id)));

            return [
              ...new Set(
                ownerFirstAdded
                  .filter(({ _id }) => matching.has(String(_id)))
                  .map(({ addedAt }) => getBusinessCalendarDate(addedAt))
                  .filter((date): date is string => Boolean(date))
              ),
            ]
              .sort()
              .map((_id) => ({ _id }));
          })
      : null;

  const availableAddedDatesQuery =
    ownerCalendarQuery ??
    (options.ownedPharmacyIds || query.pharmacyId
      ? ProductOffer.aggregate<{ _id: string }>([
          { $match: calendarOfferFilter },
          {
            $lookup: {
              from: Product.collection.name,
              let: { productId: '$productId' },
              pipeline: [
                {
                  $match: {
                    ...calendarProductFilter,
                    $expr: { $eq: ['$_id', '$$productId'] },
                  },
                },
                { $limit: 1 },
              ],
              as: '_product',
            },
          },
          { $match: { '_product.0': { $exists: true } } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                  timezone: 'Europe/Kyiv',
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
      : Promise.resolve(null));

  const earliestCreatedAtQuery = options.ownedPharmacyIds
    ? ProductOffer.findOne({ pharmacyId: { $in: options.ownedPharmacyIds } })
        .sort({ createdAt: 1 })
        .select('createdAt')
        .lean<{ createdAt: Date } | null>()
    : query.pharmacyId
      ? ProductOffer.findOne({ pharmacyId: query.pharmacyId })
          .sort({ createdAt: 1 })
          .select('createdAt')
          .lean<{ createdAt: Date } | null>()
      : Product.findOne(productTableScopeFilter)
          .sort({ createdAt: 1 })
          .select('createdAt')
          .lean<{ createdAt: Date } | null>();

  const dateOrder =
    ownerFirstAdded && (!query.sort || query.sort === 'newest')
      ? ownerFirstAdded
      : query.pharmacyId && (!query.sort || query.sort === 'newest')
        ? await ProductOffer.aggregate<{ _id: Types.ObjectId; addedAt: Date }>([
            { $match: { pharmacyId: new Types.ObjectId(query.pharmacyId) } },
            { $group: { _id: '$productId', addedAt: { $min: '$createdAt' } } },
            { $sort: { addedAt: -1, _id: 1 } },
          ])
        : null;

  const productsQuery = dateOrder
    ? Product.find(filter)
        .lean()
        .then((matching) => {
          const byId = new Map(
            matching.map((product) => [String(product._id), product])
          );

          return dateOrder
            .map(({ _id }) => byId.get(String(_id)))
            .filter((product): product is (typeof matching)[number] =>
              Boolean(product)
            )
            .slice(skip, skip + query.perPage);
        })
    : Product.find(filter).sort(sort).skip(skip).limit(query.perPage).lean();

  const [
    products,
    total,
    favorites,
    ownProductStatistics,
    earliestCreatedRecord,
    availableAddedDatesRows,
  ] = await Promise.all([
    productsQuery,
    Product.countDocuments(filter),
    getClientFavorites(userId),

    options.ownedPharmacyIds
      ? getOwnProductStatistics(
          query.pharmacyId ? [query.pharmacyId] : options.ownedPharmacyIds
        )
      : query.pharmacyId
        ? getOwnProductStatistics([query.pharmacyId])
        : Promise.resolve(undefined),

    earliestCreatedAtQuery,
    availableAddedDatesQuery,
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

    earliestCreatedAt:
      ownerFirstAdded && !query.pharmacyId
        ? ownerFirstAdded.length
          ? getBusinessCalendarDate(
              ownerFirstAdded[ownerFirstAdded.length - 1]!.addedAt
            )
          : null
        : earliestCreatedRecord
          ? getBusinessCalendarDate(earliestCreatedRecord.createdAt)
          : null,

    ...(availableAddedDatesRows
      ? { availableAddedDates: availableAddedDatesRows.map((row) => row._id) }
      : {}),

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
