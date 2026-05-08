import { Types } from 'mongoose';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Product } from '../models/product.model';
import { User } from '../models/user.model';
import { httpError } from '../utils/httpError';

import type {
  ProductCategory,
  ProductOfferEntity,
  ProductOfferResponseDto,
  ProductResponseDto,
  ProductReviewResponseDto,
} from '../types/product';

//===============================================================

type ProductsQuery = {
  page: number;
  perPage: number;
  keyword?: string;
  category?: ProductCategory;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'price-asc' | 'price-desc' | 'rating-desc' | 'newest';
};

type CreateReviewInput = {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
};

//===============================================================

type FavoriteUserDocument = {
  favoriteProductIds?: Array<Types.ObjectId | string>;
};

//===============================================================

type ProductReviewDocument = {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  isModerated: boolean;
  moderatedAt?: Date;
  createdAt: Date;
};

//===============================================================

type ProductDocument = {
  _id: Types.ObjectId;
  name: string;
  slug?: string;
  article?: string;
  description?: string;
  category: ProductCategory;
  price?: number;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  storeId?: Types.ObjectId;
  storeName?: string;
  offers?: ProductOfferEntity[];
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  reviews?: ProductReviewDocument[];
  createdAt: Date;
};

//===============================================================

type ProductSortOption = Record<string, 1 | -1>;

//===============================================================

function serializeOffer(offer: ProductOfferEntity): ProductOfferResponseDto {
  return {
    storeId: offer.storeId.toString(),
    storeName: offer.storeName,
    ...(offer.storeCity ? { storeCity: offer.storeCity } : {}),
    ...(offer.storeAddress ? { storeAddress: offer.storeAddress } : {}),
    ...(offer.storePhone ? { storePhone: offer.storePhone } : {}),
    ...(offer.storeImageUrl ? { storeImageUrl: offer.storeImageUrl } : {}),
    ...(typeof offer.storeRating === 'number'
      ? { storeRating: offer.storeRating }
      : {}),
    ...(typeof offer.storeReviewsCount === 'number'
      ? { storeReviewsCount: offer.storeReviewsCount }
      : {}),
    price: offer.price,
    totalQuantity: offer.totalQuantity,
    activeQuantity: offer.activeQuantity,
    reservedQuantity: offer.reservedQuantity,
    inStock: offer.inStock && offer.activeQuantity > 0,
  };
}

//===============================================================

function getLegacyOffer(
  product: ProductDocument
): ProductOfferResponseDto | null {
  if (!product.storeId || typeof product.price !== 'number') return null;

  return {
    storeId: product.storeId.toString(),
    storeName: product.storeName ?? 'Pharmacy',
    price: product.price,
    totalQuantity: product.inStock ? 100 : 0,
    activeQuantity: product.inStock ? 100 : 0,
    reservedQuantity: 0,
    inStock: product.inStock,
  };
}

//===============================================================

function getOffers(product: ProductDocument): ProductOfferResponseDto[] {
  const serializedOffers = (product.offers ?? []).map((offer) =>
    serializeOffer(offer)
  );

  if (serializedOffers.length > 0) return serializedOffers;

  const legacyOffer = getLegacyOffer(product);

  return legacyOffer ? [legacyOffer] : [];
}

//===============================================================

function getMinPrice(product: ProductDocument): number {
  const offers = getOffers(product).filter((offer) => offer.inStock);

  if (offers.length > 0) {
    return Math.min(...offers.map((offer) => offer.price));
  }

  return product.price ?? 0;
}

//===============================================================

async function getFavoriteProductIds(userId?: string): Promise<Set<string>> {
  if (!userId) return new Set();

  const user = await User.findById(userId)
    .select('favoriteProductIds')
    .lean<FavoriteUserDocument | null>();

  const favoriteProductIds = user?.favoriteProductIds ?? [];

  return new Set(favoriteProductIds.map((id) => id.toString()));
}

//===============================================================

function getModeratedReviews(
  product: ProductDocument
): ProductReviewDocument[] {
  return (product.reviews ?? []).filter(
    (review: ProductReviewDocument) => review.isModerated
  );
}

//===============================================================

function getAverageRating(reviews: ProductReviewDocument[]): number | null {
  if (reviews.length === 0) return null;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

  return Number((totalRating / reviews.length).toFixed(1));
}

//===============================================================

function serializeProduct(
  product: ProductDocument,
  favoriteProductIds = new Set<string>()
): ProductResponseDto {
  const offers = getOffers(product);
  const productId = product._id.toString();
  const firstOffer = offers[0];

  const moderatedReviews = getModeratedReviews(product);
  const averageRating = getAverageRating(moderatedReviews);

  return {
    id: productId,
    name: product.name,
    ...(product.slug ? { slug: product.slug } : {}),
    article: product.article ?? `ART-${productId.slice(-6).toUpperCase()}`,
    ...(product.description ? { description: product.description } : {}),
    category: product.category,
    price: getMinPrice(product),
    ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
    ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
    ...(product.dosage ? { dosage: product.dosage } : {}),
    ...(product.packageQuantity
      ? { packageQuantity: product.packageQuantity }
      : {}),
    ...(firstOffer ? { storeId: firstOffer.storeId } : {}),
    ...(firstOffer ? { storeName: firstOffer.storeName } : {}),
    foundInStoresCount: offers.length,
    offers,
    inStock: offers.some((offer) => offer.inStock),
    ...(averageRating !== null ? { rating: averageRating } : {}),
    reviewsCount: moderatedReviews.length,
    isFavorite: favoriteProductIds.has(productId),
  };
}

//===============================================================

function serializeReview(
  review: ProductReviewDocument
): ProductReviewResponseDto {
  return {
    id: review._id.toString(),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

//===============================================================

function getSort(sort?: ProductsQuery['sort']): ProductSortOption {
  switch (sort) {
    case 'price-asc':
      return { price: 1 };

    case 'price-desc':
      return { price: -1 };

    case 'rating-desc':
      return { rating: -1, reviewsCount: -1 };

    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

//===============================================================

export async function getProductsService(
  query: ProductsQuery,
  userId?: string
) {
  const {
    page,
    perPage,
    keyword,
    category,
    storeId,
    minPrice,
    maxPrice,
    inStock,
    sort,
  } = query;

  const andFilters: Record<string, unknown>[] = [];

  if (keyword) {
    andFilters.push({
      $or: [
        { name: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') },
        { manufacturer: new RegExp(keyword, 'i') },
        { article: new RegExp(keyword, 'i') },
      ],
    });
  }

  if (category) {
    andFilters.push({ category });
  }

  if (storeId) {
    andFilters.push({
      $or: [
        { storeId: new Types.ObjectId(storeId) },
        { 'offers.storeId': new Types.ObjectId(storeId) },
      ],
    });
  }

  if (typeof inStock === 'boolean') {
    andFilters.push({ inStock });
  }

  if (typeof minPrice === 'number' || typeof maxPrice === 'number') {
    andFilters.push({
      price: {
        ...(typeof minPrice === 'number' ? { $gte: minPrice } : {}),
        ...(typeof maxPrice === 'number' ? { $lte: maxPrice } : {}),
      },
    });
  }

  const filter = andFilters.length > 0 ? { $and: andFilters } : {};

  const skip = (page - 1) * perPage;

  const [products, total, favoriteProductIds] = await Promise.all([
    Product.find(filter)
      .sort(getSort(sort))
      .skip(skip)
      .limit(perPage)
      .lean<ProductDocument[]>(),
    Product.countDocuments(filter),
    getFavoriteProductIds(userId),
  ]);

  return {
    items: products.map((product: ProductDocument) =>
      serializeProduct(product, favoriteProductIds)
    ),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

//===============================================================

export async function getProductDetailsService(
  productId: string,
  userId?: string
) {
  const [product, favoriteProductIds] = await Promise.all([
    Product.findById(productId).lean<ProductDocument | null>(),
    getFavoriteProductIds(userId),
  ]);

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  return {
    product: serializeProduct(product, favoriteProductIds),
  };
}

//===============================================================

export async function getProductReviewsService(productId: string) {
  const product = await Product.findById(productId)
    .select('reviews')
    .lean<ProductDocument | null>();

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const reviews = (product.reviews ?? [])
    .filter((review: ProductReviewDocument) => review.isModerated)
    .sort((a: ProductReviewDocument, b: ProductReviewDocument) => {
      const aTime = (a.moderatedAt ?? a.createdAt).getTime();
      const bTime = (b.moderatedAt ?? b.createdAt).getTime();

      return bTime - aTime;
    });

  return {
    items: reviews.map((review: ProductReviewDocument) =>
      serializeReview(review)
    ),
    total: reviews.length,
  };
}

//===============================================================

export async function createProductReviewService(
  productId: string,
  input: CreateReviewInput
) {
  const product = await Product.findById(productId).select('_id');

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  await Product.updateOne(
    { _id: productId },
    {
      $push: {
        reviews: {
          userId: input.userId,
          userName: input.userName,
          rating: input.rating,
          comment: input.comment,
          isModerated: false,
          createdAt: new Date(),
        },
      },
    }
  );

  return {
    message: 'Review was accepted and will be visible after moderation.',
  };
}

//===============================================================

export async function toggleFavoriteProductService(
  productId: string,
  userId: string
) {
  const product = await Product.exists({ _id: productId });

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const user = await User.findById(userId)
    .select('favoriteProductIds')
    .lean<FavoriteUserDocument | null>();

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  const favoriteIds = (user.favoriteProductIds ?? []).map((id) =>
    id.toString()
  );

  const isFavorite = favoriteIds.includes(productId);

  if (isFavorite) {
    await User.updateOne(
      { _id: userId },
      { $pull: { favoriteProductIds: productId } }
    );

    return {
      isFavorite: false,
      message: 'Product was removed from favorites.',
    };
  }

  await User.updateOne(
    { _id: userId },
    { $addToSet: { favoriteProductIds: productId } }
  );

  return {
    isFavorite: true,
    message: 'Product was added to favorites.',
  };
}
