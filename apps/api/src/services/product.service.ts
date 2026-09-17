import mongoose, { Types } from 'mongoose';

import { PHARMACY_STATUSES, USER_ROLES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { REVIEW_ERROR_CODES } from '../constants/reviews';
import { PRODUCT_MANAGEMENT_ERROR_CODES } from '../constants/product-management';
import { API_MESSAGES } from '../constants/messages';

import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { ProductReview } from '../models/productReview.model';
import { Order } from '../models/order.model';

import type {
  ManagedProductsQuery,
  ProductFiltersQuery,
  PublicProductsQuery,
} from '../schemas/product.schema';

import type {
  ProductCardSummaryResponseDto,
  ProductFilterOptionsResponseDto,
  ProductEntity,
  ProductOfferResponseDto,
  ProductResponseDto,
  ProductReviewResponseDto,
  ReviewModerationStatus,
} from '../types/product';

import type { ProductCategory } from '../types/categories';
import type { UserRole } from '../types/user';

import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from '../types/categories';

import { recordInitialStockArrival } from './stockMovement.service';
import { httpError } from '../utils/httpError';

import {
  isDuplicateProductOfferError,
  isDuplicateProductReviewError,
} from '../utils/mongoError';

import { getEndOfDay, getStartOfDay } from '../utils/date-range';
import { createFlexibleSearchRegExp, createSafeRegExp } from '../utils/regexp';

import { requireISODateTime } from '../utils/date-contract';
import { buildPublicEntitySlugId } from '../utils/public-slug-id';

//===============================================================

type ProductDocument = ProductEntity & { _id: Types.ObjectId };

//===============================================================

type ProductsQuery = ManagedProductsQuery;

//===============================================================

type CreateReviewInput = {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
};

type PendingReviewsQuery = { page: number; perPage: number };

type PendingReviewDto = {
  productId: string;
  productName: string;
  reviewId: string;
  userName: string;
  rating: number;
  comment: string;
  status: ReviewModerationStatus;
  createdAt: string;
};

//===============================================================

const PHARMACY_PRODUCT_MANAGEMENT_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

const PUBLIC_PRODUCT_OFFER_PHARMACY_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

//===============================================================

type ProductManagementActor = Readonly<{
  userId: string;
  role?: UserRole;
}>;

type ProductOfferVisibility =
  | Readonly<{ mode: 'public' }>
  | Readonly<{ mode: 'pharmacy-management'; pharmacyId: string }>
  | Readonly<{ mode: 'admin-management' }>;

//===============================================================

async function getClientFavorites(userId?: string) {
  if (!userId)
    return { products: new Set<string>(), pharmacies: new Set<string>() };

  const client = await Client.findOne({ userId }).lean<{
    favoriteProductIds?: Types.ObjectId[];
    favoritePharmacyIds?: Types.ObjectId[];
  } | null>();

  return {
    products: new Set((client?.favoriteProductIds ?? []).map(String)),
    pharmacies: new Set((client?.favoritePharmacyIds ?? []).map(String)),
  };
}

//===============================================================

async function getOffersByProductIds(
  productIds: Types.ObjectId[],
  favoritePharmacyIds = new Set<string>(),
  visibility: ProductOfferVisibility = { mode: 'public' }
) {
  const offers = await ProductOffer.find({
    productId: { $in: productIds },
  }).lean();

  const operationalOffers = offers.filter((offer) => {
    if (visibility.mode === 'admin-management') return true;

    return (
      visibility.mode === 'pharmacy-management' &&
      String(offer.pharmacyId) === visibility.pharmacyId
    );
  });

  const relatedOfferIds = new Set<string>(
    (operationalOffers.length
      ? await Order.distinct('items.productOfferId', {
          'items.productOfferId': {
            $in: operationalOffers.map((offer) => offer._id),
          },
        })
      : []
    ).map(String)
  );

  const pharmacyIds = [
    ...new Set(offers.map((offer) => String(offer.pharmacyId))),
  ];

  const pharmacyFilter: Record<string, unknown> = {
    _id: { $in: pharmacyIds },
  };

  if (visibility.mode === 'public') {
    pharmacyFilter.status = { $in: PUBLIC_PRODUCT_OFFER_PHARMACY_STATUSES };
  } else if (visibility.mode === 'pharmacy-management') {
    pharmacyFilter.$or = [
      { status: { $in: PUBLIC_PRODUCT_OFFER_PHARMACY_STATUSES } },
      { _id: new Types.ObjectId(visibility.pharmacyId) },
    ];
  }

  const pharmacies = await Pharmacy.find(pharmacyFilter).lean();

  const pharmacyMap = new Map(
    pharmacies.map((pharmacy) => [String(pharmacy._id), pharmacy])
  );

  const result = new Map<string, ProductOfferResponseDto[]>();

  for (const offer of offers) {
    const pharmacy = pharmacyMap.get(String(offer.pharmacyId));

    if (!pharmacy) continue;

    const canSeeOperationalFields =
      visibility.mode === 'admin-management' ||
      (visibility.mode === 'pharmacy-management' &&
        String(offer.pharmacyId) === visibility.pharmacyId);

    const item: ProductOfferResponseDto = {
      id: String(offer._id),
      pharmacyId: String(pharmacy._id),
      pharmacyName: pharmacy.name,
      ...(pharmacy.city ? { pharmacyCity: pharmacy.city } : {}),
      ...(pharmacy.address ? { pharmacyAddress: pharmacy.address } : {}),
      ...(pharmacy.phone ? { pharmacyPhone: pharmacy.phone } : {}),
      ...(pharmacy.imageUrl ? { pharmacyImageUrl: pharmacy.imageUrl } : {}),
      pharmacyRating: pharmacy.rating ?? 0,
      pharmacyReviewsCount: pharmacy.reviewsCount ?? 0,
      pharmacyIsFavorite: favoritePharmacyIds.has(String(pharmacy._id)),
      price: offer.price,
      availableQuantity: offer.availableQuantity,
      inStock: offer.availableQuantity > 0,
      ...(canSeeOperationalFields
        ? {
            totalQuantity: offer.totalQuantity,
            reservedQuantity: offer.reservedQuantity,
            hasRelatedOrders: relatedOfferIds.has(String(offer._id)),
          }
        : {}),
      createdAt: requireISODateTime(offer.createdAt, 'productOffer.createdAt'),
      updatedAt: requireISODateTime(offer.updatedAt, 'productOffer.updatedAt'),
    };

    const key = String(offer.productId);
    result.set(key, [...(result.get(key) ?? []), item]);
  }

  return result;
}

//===============================================================

type ProductOfferSummary = Readonly<{
  minPrice: number;
  maxPrice: number;
  pharmaciesCount: number;
}>;

//===============================================================

async function getOfferSummaryByProductIds(
  productIds: Types.ObjectId[],
  pharmacyId?: string
): Promise<Map<string, ProductOfferSummary>> {
  if (productIds.length === 0) return new Map();

  const match: Record<string, unknown> = {
    productId: { $in: productIds },
    availableQuantity: { $gt: 0 },
  };

  if (pharmacyId) match.pharmacyId = new Types.ObjectId(pharmacyId);

  const rows = await ProductOffer.aggregate<{
    _id: Types.ObjectId;
    minPrice: number;
    maxPrice: number;
    pharmaciesCount: number;
  }>([
    { $match: match },
    {
      $lookup: {
        from: Pharmacy.collection.name,
        localField: 'pharmacyId',
        foreignField: '_id',
        as: 'pharmacy',
      },
    },
    { $unwind: '$pharmacy' },
    {
      $match: {
        'pharmacy.status': { $in: ['active', 'on_moderation'] },
      },
    },
    {
      $group: {
        _id: { productId: '$productId', pharmacyId: '$pharmacyId' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $group: {
        _id: '$_id.productId',
        minPrice: { $min: '$minPrice' },
        maxPrice: { $max: '$maxPrice' },
        pharmaciesCount: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      String(row._id),
      {
        minPrice: row.minPrice,
        maxPrice: row.maxPrice,
        pharmaciesCount: row.pharmaciesCount,
      },
    ])
  );
}

//===============================================================

function serializeProductCardSummary(
  product: ProductDocument,
  offerSummary: ProductOfferSummary | undefined,
  favoriteIds: Set<string>
): ProductCardSummaryResponseDto {
  const productId = String(product._id);
  const minPrice = offerSummary?.minPrice ?? null;
  const maxPrice = offerSummary?.maxPrice ?? null;
  const pharmaciesCount = offerSummary?.pharmaciesCount ?? 0;

  return {
    id: productId,
    name: product.name,
    publicSlugId: buildPublicEntitySlugId(
      'product',
      product.slug ?? product.name,
      productId
    ),
    article: product.article ?? '',
    category: product.category,
    status: product.status,
    price: minPrice ?? product.price ?? 0,
    minPrice,
    maxPrice,
    ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
    ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
    foundInPharmaciesCount: pharmaciesCount,
    availableInPharmaciesCount: pharmaciesCount,
    inStock: pharmaciesCount > 0,
    rating: product.rating ?? 0,
    reviewsCount: product.reviewsCount ?? 0,
    isFavorite: favoriteIds.has(productId),
    createdAt: requireISODateTime(product.createdAt, 'product.createdAt'),
    updatedAt: requireISODateTime(product.updatedAt, 'product.updatedAt'),
  };
}

//===============================================================

function serializeProductDetails(
  product: ProductDocument,
  offers: ProductOfferResponseDto[],
  favoriteIds: Set<string>
): ProductResponseDto {
  const availableOffers = offers.filter((offer) => offer.inStock);
  const first = availableOffers[0] ?? offers[0];

  const minPrice = availableOffers.length
    ? Math.min(...availableOffers.map((offer) => offer.price))
    : (product.price ?? 0);

  const productId = String(product._id);

  return {
    id: productId,
    name: product.name,
    publicSlugId: buildPublicEntitySlugId(
      'product',
      product.slug ?? product.name,
      productId
    ),
    ...(product.slug ? { slug: product.slug } : {}),
    article: product.article ?? '',
    ...(product.description ? { description: product.description } : {}),
    category: product.category,
    status: product.status,
    price: minPrice,
    ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
    ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
    ...(product.dosage ? { dosage: product.dosage } : {}),
    ...(product.packageQuantity
      ? { packageQuantity: product.packageQuantity }
      : {}),
    ...(first
      ? { pharmacyId: first.pharmacyId, pharmacyName: first.pharmacyName }
      : {}),
    foundInPharmaciesCount: availableOffers.length,
    availableInPharmaciesCount: availableOffers.length,
    offers,
    inStock: availableOffers.length > 0,
    rating: product.rating ?? 0,
    reviewsCount: product.reviewsCount ?? 0,
    isFavorite: favoriteIds.has(productId),
    createdAt: requireISODateTime(product.createdAt, 'product.createdAt'),
    updatedAt: requireISODateTime(product.updatedAt, 'product.updatedAt'),
  };
}

//===============================================================

async function getAvailableFilterCategories(
  query: ProductFiltersQuery
): Promise<ProductCategory[]> {
  if (!query.pharmacyId && typeof query.inStock !== 'boolean') {
    return [...PRODUCT_CATEGORIES];
  }

  const offerFilter: Record<string, unknown> = {};

  if (query.pharmacyId) offerFilter.pharmacyId = query.pharmacyId;

  if (query.inStock === false && !query.pharmacyId) {
    const availableProductIds = await ProductOffer.distinct('productId', {
      availableQuantity: { $gt: 0 },
    });

    const categories = await Product.distinct('category', {
      _id: { $nin: availableProductIds },
      status: 'active',
    });

    const categorySet = new Set(categories.map(String));

    return PRODUCT_CATEGORIES.filter((category) => categorySet.has(category));
  }

  if (query.inStock === true) offerFilter.availableQuantity = { $gt: 0 };
  if (query.inStock === false) offerFilter.availableQuantity = 0;

  const productIds = await ProductOffer.distinct('productId', offerFilter);

  if (!productIds.length) return [];

  const categories = await Product.distinct('category', {
    _id: { $in: productIds },
    status: 'active',
  });

  const categorySet = new Set(categories.map(String));

  return PRODUCT_CATEGORIES.filter((category) => categorySet.has(category));
}

//===============================================================

export async function getProductFiltersService(
  query: ProductFiltersQuery = {}
): Promise<ProductFilterOptionsResponseDto> {
  const categories = await getAvailableFilterCategories(query);

  return {
    categories: [
      { value: 'all', label: 'All categories' },
      ...categories.map((value) => ({
        value,
        label: PRODUCT_CATEGORY_LABELS[value],
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

async function getProductsByScope(
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
  if (query.category) filter.category = query.category;

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

export async function getProductsService(
  query: PublicProductsQuery,
  userId?: string
) {
  return getProductsByScope(query, 'public', userId);
}

//===============================================================

async function getCurrentUserPharmacyForManagedProductRead(userId: string) {
  const pharmacy = await Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

  if (!pharmacy) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Pharmacy profile was not found.',
      undefined,
      PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_NOT_FOUND
    );
  }

  return pharmacy;
}

//===============================================================

function assertCurrentPharmacyScope(
  requestedPharmacyId: string | undefined,
  currentPharmacyId: string
): void {
  if (requestedPharmacyId && requestedPharmacyId !== currentPharmacyId) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'You do not have access to this pharmacy.'
    );
  }
}

//===============================================================

async function getManagedProductOfferVisibility(
  actor: ProductManagementActor
): Promise<ProductOfferVisibility> {
  if (actor.role === USER_ROLES.ADMIN) {
    return { mode: 'admin-management' };
  }

  if (actor.role !== USER_ROLES.PHARMACY) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Access denied.');
  }

  const pharmacy = await getCurrentUserPharmacyForManagedProductRead(
    actor.userId
  );

  return {
    mode: 'pharmacy-management',
    pharmacyId: String(pharmacy._id),
  };
}

//===============================================================

async function resolveManagedProductsAccess(
  query: ManagedProductsQuery,
  actor: ProductManagementActor
): Promise<{
  query: ManagedProductsQuery;
  offerVisibility: ProductOfferVisibility;
}> {
  const offerVisibility = await getManagedProductOfferVisibility(actor);

  if (offerVisibility.mode !== 'pharmacy-management') {
    return { query, offerVisibility };
  }

  const currentPharmacyId = offerVisibility.pharmacyId;

  assertCurrentPharmacyScope(query.pharmacyId, currentPharmacyId);
  assertCurrentPharmacyScope(query.addedToPharmacyId, currentPharmacyId);

  return {
    query: {
      ...query,
      ...(query.pharmacyId ? { pharmacyId: currentPharmacyId } : {}),
      ...(typeof query.addedToMyPharmacy === 'boolean' ||
      query.addedToPharmacyId
        ? { addedToPharmacyId: currentPharmacyId }
        : {}),
    },
    offerVisibility,
  };
}

//===============================================================

export async function getManagedProductStatisticsService(
  actor: ProductManagementActor
) {
  if (actor.role !== USER_ROLES.PHARMACY) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Access denied.');
  }

  const pharmacy = await getCurrentUserPharmacyForManagedProductRead(
    actor.userId
  );
  const pharmacyId = pharmacy._id;

  const [statistics] = await Product.aggregate<{
    active: number;
    blocked: number;
    addedToPharmacy: number;
    notAddedToPharmacy: number;
  }>([
    { $match: { status: { $in: ['active', 'blocked'] } } },
    {
      $lookup: {
        from: ProductOffer.collection.name,
        let: { productId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$productId', '$$productId'] },
                  { $eq: ['$pharmacyId', pharmacyId] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'currentPharmacyOffers',
      },
    },
    {
      $group: {
        _id: null,
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        blocked: {
          $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] },
        },
        addedToPharmacy: {
          $sum: {
            $cond: [{ $gt: [{ $size: '$currentPharmacyOffers' }, 0] }, 1, 0],
          },
        },
        notAddedToPharmacy: {
          $sum: {
            $cond: [{ $eq: [{ $size: '$currentPharmacyOffers' }, 0] }, 1, 0],
          },
        },
      },
    },
    { $project: { _id: 0 } },
  ]);

  return (
    statistics ?? {
      active: 0,
      blocked: 0,
      addedToPharmacy: 0,
      notAddedToPharmacy: 0,
    }
  );
}

//===============================================================

export async function getManagedProductsService(
  query: ManagedProductsQuery,
  actor: ProductManagementActor,
  options: Readonly<{ includeOffers?: boolean }> = {}
) {
  const access = await resolveManagedProductsAccess(query, actor);

  return getProductsByScope(access.query, 'management', undefined, {
    ...options,
    offerVisibility: access.offerVisibility,
  });
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

  const favoriteIds = new Set(favoriteProductIds.map(String));

  return {
    items: products.map((product) =>
      serializeProductCardSummary(
        product,
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

async function getProductDetailsByScope(
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

  return {
    product: serializeProductDetails(
      product,
      offerMap.get(String(product._id)) ?? [],
      favorites.products
    ),
  };
}

//===============================================================

function createInitialOfferStockQuantity(productId: Types.ObjectId): number {
  const tail = productId.toString().slice(-2);
  const parsed = Number.parseInt(tail, 16);

  return 100 + (Number.isNaN(parsed) ? 0 : parsed % 35);
}

//===============================================================

export async function getProductDetailsService(
  productId: string,
  userId?: string
) {
  return getProductDetailsByScope(productId, userId, 'public');
}

//===============================================================

export async function getManagedProductDetailsService(
  productId: string,
  actor: ProductManagementActor
) {
  const offerVisibility = await getManagedProductOfferVisibility(actor);

  return getProductDetailsByScope(
    productId,
    undefined,
    'management',
    offerVisibility
  );
}

//===============================================================

async function getCurrentUserPharmacyForProductManagement(userId: string) {
  const pharmacy = await Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  });

  if (!pharmacy) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'Pharmacy profile was not found.',
      undefined,
      PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_NOT_FOUND
    );
  }

  const canManageProducts = PHARMACY_PRODUCT_MANAGEMENT_STATUSES.some(
    (status) => status === pharmacy.status
  );

  if (!canManageProducts) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Products can be added only after Admin verifies the pharmacy profile.',
      undefined,
      PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_LOCKED
    );
  }

  return pharmacy;
}

//===============================================================

export async function addProductToMyPharmacyService(
  productId: string,
  userId: string
) {
  const [pharmacy, product] = await Promise.all([
    getCurrentUserPharmacyForProductManagement(userId),
    Product.findById(productId).lean(),
  ]);

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  if (product.status !== 'active') {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Blocked products cannot be added to a pharmacy.',
      undefined,
      PRODUCT_MANAGEMENT_ERROR_CODES.PRODUCT_BLOCKED
    );
  }

  const initialQuantity = createInitialOfferStockQuantity(product._id);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const existingOffer = await ProductOffer.exists({
        productId: product._id,
        pharmacyId: pharmacy._id,
      }).session(session);

      if (existingOffer) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This product is already added to your pharmacy.',
          undefined,
          PRODUCT_MANAGEMENT_ERROR_CODES.ALREADY_ADDED
        );
      }

      const [offer] = await ProductOffer.create(
        [
          {
            productId: product._id,
            pharmacyId: pharmacy._id,
            price: product.price ?? 0,
            totalQuantity: initialQuantity,
            availableQuantity: initialQuantity,
            reservedQuantity: 0,
          },
        ],
        { session }
      );

      await recordInitialStockArrival(
        {
          _id: offer._id as Types.ObjectId,
          productId: offer.productId as unknown as Types.ObjectId,
          pharmacyId: offer.pharmacyId as unknown as Types.ObjectId,
          price: offer.price,
          totalQuantity: offer.totalQuantity,
          availableQuantity: offer.availableQuantity,
          reservedQuantity: offer.reservedQuantity,
        },
        'Initial stock quantity added when the product was added to the pharmacy.',
        session
      );
    });
  } catch (error) {
    if (isDuplicateProductOfferError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'This product is already added to your pharmacy.',
        undefined,
        PRODUCT_MANAGEMENT_ERROR_CODES.ALREADY_ADDED
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  const details = await getManagedProductDetailsService(productId, {
    userId,
    role: USER_ROLES.PHARMACY,
  });

  return {
    ...details,
    message: 'Product added to your pharmacy.',
  };
}

//===============================================================

export async function removeProductFromMyPharmacyService(
  productId: string,
  userId: string
) {
  const [pharmacy, product] = await Promise.all([
    getCurrentUserPharmacyForProductManagement(userId),
    Product.findById(productId).lean(),
  ]);

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const offer = await ProductOffer.findOne({
        productId: product._id,
        pharmacyId: pharmacy._id,
      }).session(session);

      if (!offer) {
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'This product is not added to your pharmacy.',
          undefined,
          PRODUCT_MANAGEMENT_ERROR_CODES.NOT_ADDED
        );
      }

      const hasRelatedOrders = await Order.exists({
        pharmacyId: pharmacy._id,
        'items.productOfferId': offer._id,
      }).session(session);

      if (hasRelatedOrders) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Product cannot be removed because it already has related orders.',
          undefined,
          PRODUCT_MANAGEMENT_ERROR_CODES.HAS_RELATED_ORDERS
        );
      }

      await ProductOffer.deleteOne({ _id: offer._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  const details = await getManagedProductDetailsService(productId, {
    userId,
    role: USER_ROLES.PHARMACY,
  });

  return {
    ...details,
    message: 'Product was removed from your pharmacy.',
  };
}

//===============================================================

async function getApprovedProductReviews(productId: string) {
  const reviews = await ProductReview.find({ productId, status: 'approved' })
    .sort({ createdAt: -1 })
    .lean();

  const items: ProductReviewResponseDto[] = reviews.map((review) => ({
    id: String(review._id),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  }));

  return { items, total: items.length };
}

//===============================================================

export async function getProductReviewsService(productId: string) {
  const exists = await Product.exists({
    _id: productId,
    status: 'active',
  });

  if (!exists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  return getApprovedProductReviews(productId);
}

//===============================================================

export async function getManagedProductReviewsService(
  productId: string,
  actor: ProductManagementActor
) {
  await getManagedProductDetailsService(productId, actor);
  return getApprovedProductReviews(productId);
}

//===============================================================

export async function createProductReviewService(
  productId: string,
  input: CreateReviewInput
) {
  const exists = await Product.exists({ _id: productId, status: 'active' });

  if (!exists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  try {
    await ProductReview.create({
      productId,
      userId: input.userId,
      userName: input.userName,
      rating: input.rating,
      comment: input.comment,
      status: 'on_moderation',
    });
  } catch (error) {
    if (isDuplicateProductReviewError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'You already have a pending or approved review for this product.',
        undefined,
        REVIEW_ERROR_CODES.ALREADY_SUBMITTED
      );
    }

    throw error;
  }

  return { message: 'Product review was submitted for moderation.' };
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

//===============================================================

export async function getPendingProductReviewsService(
  query: PendingReviewsQuery
) {
  const skip = (query.page - 1) * query.perPage;

  const [reviews, total] = await Promise.all([
    ProductReview.find({ status: 'on_moderation' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.perPage)
      .lean(),
    ProductReview.countDocuments({ status: 'on_moderation' }),
  ]);

  const products = await Product.find({
    _id: { $in: reviews.map((review) => review.productId) },
  })
    .select('name')
    .lean();

  const names = new Map(
    products.map((product) => [String(product._id), product.name])
  );

  const items: PendingReviewDto[] = reviews.map((review) => ({
    productId: String(review.productId),
    productName: names.get(String(review.productId)) ?? 'Product',
    reviewId: String(review._id),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
  }));

  return {
    items,
    page: total === 0 ? 1 : query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
  };
}

//===============================================================

export async function moderateProductReviewService(
  productId: string,
  reviewId: string,
  input: {
    status: 'approved' | 'rejected';
    reason?: string;
    moderatorId: string;
  }
) {
  const review = await ProductReview.findOneAndUpdate(
    { _id: reviewId, productId },
    {
      $set: {
        status: input.status,
        moderationReason: input.reason,
        moderatedBy: input.moderatorId,
        moderatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  if (!review) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product review was not found.');
  }

  const approved = await ProductReview.find({ productId, status: 'approved' })
    .select('rating')
    .lean();

  const rating = approved.length
    ? Number(
        (
          approved.reduce((sum, item) => sum + item.rating, 0) / approved.length
        ).toFixed(1)
      )
    : 0;

  await Product.updateOne(
    { _id: productId },
    { $set: { rating, reviewsCount: approved.length } }
  );

  return {
    message:
      input.status === 'approved'
        ? 'Product review was approved.'
        : 'Product review was rejected.',
    rating,
    reviewsCount: approved.length,
    moderatedAt: review.moderatedAt?.toISOString(),
  };
}
