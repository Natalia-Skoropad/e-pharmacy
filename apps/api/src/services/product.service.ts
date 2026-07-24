import { Types } from 'mongoose';

import { PHARMACY_STATUSES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';

import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { ProductReview } from '../models/productReview.model';
import { Order } from '../models/order.model';

import type {
  ProductFilterOptionsResponseDto,
  ProductEntity,
  ProductOfferResponseDto,
  ProductResponseDto,
  ProductReviewResponseDto,
  ReviewModerationStatus,
} from '../types/product';

import type { ProductCategory } from '../types/categories';

import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from '../types/categories';

import { recordInitialStockArrival } from './stockMovement.service';
import { httpError } from '../utils/httpError';
import { getEndOfDay, getStartOfDay } from '../utils/date-range';
import { createFlexibleSearchRegExp, createSafeRegExp } from '../utils/regexp';

import { requireISODateTime } from '../utils/date-contract';

//===============================================================

type ProductDocument = ProductEntity & { _id: Types.ObjectId };

//===============================================================

type ProductsQuery = {
  page: number;
  perPage: number;
  keyword?: string;
  nameKeyword?: string;
  articleKeyword?: string;
  category?: ProductCategory;
  status?: 'active' | 'blocked';
  includeBlocked?: boolean;
  pharmacyId?: string;
  addedToPharmacyId?: string;
  addedToMyPharmacy?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  stock?: 'in-stock' | 'available' | 'empty' | 'reserved';
  addedFrom?: string;
  addedTo?: string;

  sort?:
    | 'price-asc'
    | 'price-desc'
    | 'rating-desc'
    | 'rating-asc'
    | 'name-asc'
    | 'name-desc'
    | 'newest';
};

//===============================================================

type CreateReviewInput = {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
};

type PendingReviewsQuery = { page: number; perPage: number };

type ProductFiltersQuery = {
  pharmacyId?: string;
  inStock?: boolean;
};

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
  favoritePharmacyIds = new Set<string>()
) {
  const offers = await ProductOffer.find({
    productId: { $in: productIds },
  }).lean();

  const relatedOfferIds = new Set<string>(
    (offers.length
      ? await Order.distinct('items.productOfferId', {
          'items.productOfferId': { $in: offers.map((offer) => offer._id) },
        })
      : []
    ).map(String)
  );

  const pharmacyIds = [
    ...new Set(offers.map((offer) => String(offer.pharmacyId))),
  ];

  const pharmacies = await Pharmacy.find({
    _id: { $in: pharmacyIds },
    status: { $in: ['active', 'on_moderation'] },
  }).lean();

  const pharmacyMap = new Map(
    pharmacies.map((pharmacy) => [String(pharmacy._id), pharmacy])
  );

  const result = new Map<string, ProductOfferResponseDto[]>();

  for (const offer of offers) {
    const pharmacy = pharmacyMap.get(String(offer.pharmacyId));

    if (!pharmacy) continue;

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
      totalQuantity: offer.totalQuantity,
      availableQuantity: offer.availableQuantity,
      reservedQuantity: offer.reservedQuantity,
      inStock: offer.availableQuantity > 0,
      hasRelatedOrders: relatedOfferIds.has(String(offer._id)),
      createdAt: requireISODateTime(offer.createdAt, 'productOffer.createdAt'),
      updatedAt: requireISODateTime(offer.updatedAt, 'productOffer.updatedAt'),
    };

    const key = String(offer.productId);
    result.set(key, [...(result.get(key) ?? []), item]);
  }

  return result;
}

//===============================================================

function serializeProduct(
  product: ProductDocument,
  offers: ProductOfferResponseDto[],
  favoriteIds: Set<string>
): ProductResponseDto {
  const availableOffers = offers.filter((offer) => offer.inStock);
  const first = availableOffers[0] ?? offers[0];

  const minPrice = availableOffers.length
    ? Math.min(...availableOffers.map((offer) => offer.price))
    : (product.price ?? 0);

  return {
    id: String(product._id),
    name: product.name,
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
    isFavorite: favoriteIds.has(String(product._id)),
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

export async function getProductsService(
  query: ProductsQuery,
  userId?: string
) {
  const filter: Record<string, unknown> = {};
  const tableStatusFilter =
    query.pharmacyId || query.includeBlocked
      ? { $in: ['active', 'blocked'] }
      : 'active';

  filter.status = query.status ?? tableStatusFilter;
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

  const offerMap = await getOffersByProductIds(
    products.map((product) => product._id),
    favorites.pharmacies
  );

  const items = products.map((product) =>
    serializeProduct(
      product,
      offerMap.get(String(product._id)) ?? [],
      favorites.products
    )
  );

  if (query.sort === 'price-asc') items.sort((a, b) => a.price - b.price);
  if (query.sort === 'price-desc') items.sort((a, b) => b.price - a.price);

  return {
    items,
    page: query.page,
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
  query: ProductsQuery,
  userId: string
) {
  const client = await Client.findOne({ userId })
    .select('favoriteProductIds favoritePharmacyIds')
    .lean<{
      favoriteProductIds?: Types.ObjectId[];
      favoritePharmacyIds?: Types.ObjectId[];
    } | null>();

  const favoriteProductIds = client?.favoriteProductIds ?? [];
  const favoritePharmacyIds = new Set(
    (client?.favoritePharmacyIds ?? []).map(String)
  );

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

  const offerMap = await getOffersByProductIds(
    products.map((product) => product._id),
    favoritePharmacyIds
  );

  const favoriteIds = new Set(favoriteProductIds.map(String));

  return {
    items: products.map((product) =>
      serializeProduct(
        product,
        offerMap.get(String(product._id)) ?? [],
        favoriteIds
      )
    ),
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
  };
}

//===============================================================

export async function getProductDetailsService(
  productId: string,
  userId?: string
) {
  const product = await Product.findOne({
    _id: productId,
    status: { $in: ['active', 'blocked'] },
  }).lean();

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const favorites = await getClientFavorites(userId);

  const offerMap = await getOffersByProductIds(
    [product._id],
    favorites.pharmacies
  );

  return {
    product: serializeProduct(
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

async function getCurrentUserPharmacyForProductManagement(userId: string) {
  const pharmacy = await Pharmacy.findOne({
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  });

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy profile was not found.');
  }

  const canManageProducts = PHARMACY_PRODUCT_MANAGEMENT_STATUSES.some(
    (status) => status === pharmacy.status
  );

  if (!canManageProducts) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Products can be added only after Admin verifies the pharmacy profile.'
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
      'Blocked products cannot be added to a pharmacy.'
    );
  }

  const existingOffer = await ProductOffer.findOne({
    productId: product._id,
    pharmacyId: pharmacy._id,
  }).lean();

  if (existingOffer) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'This product is already added to your pharmacy.'
    );
  }

  const initialQuantity = createInitialOfferStockQuantity(product._id);

  const offer = await ProductOffer.create({
    productId: product._id,
    pharmacyId: pharmacy._id,
    price: product.price ?? 0,
    totalQuantity: initialQuantity,
    availableQuantity: initialQuantity,
    reservedQuantity: 0,
  });

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
    'Initial stock quantity added when the product was added to the pharmacy.'
  );

  const details = await getProductDetailsService(productId, userId);

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

  const offer = await ProductOffer.findOne({
    productId: product._id,
    pharmacyId: pharmacy._id,
  });

  if (!offer) {
    throw httpError(
      HTTP_STATUS.NOT_FOUND,
      'This product is not added to your pharmacy.'
    );
  }

  const hasRelatedOrders = await Order.exists({
    pharmacyId: pharmacy._id,
    'items.productOfferId': offer._id,
  });

  if (hasRelatedOrders) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product cannot be removed because it already has related orders.'
    );
  }

  await ProductOffer.deleteOne({ _id: offer._id });

  const details = await getProductDetailsService(productId, userId);

  return {
    ...details,
    message: 'Product was removed from your pharmacy.',
  };
}

//===============================================================

export async function getProductReviewsService(productId: string) {
  const exists = await Product.exists({
    _id: productId,
    status: { $in: ['active', 'blocked'] },
  });

  if (!exists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

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

export async function createProductReviewService(
  productId: string,
  input: CreateReviewInput
) {
  const exists = await Product.exists({ _id: productId, status: 'active' });

  if (!exists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  await ProductReview.create({
    productId,
    userId: input.userId,
    userName: input.userName,
    rating: input.rating,
    comment: input.comment,
    status: 'on_moderation',
  });

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
    page: query.page,
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
