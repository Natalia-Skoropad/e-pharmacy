import { Types } from 'mongoose';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Product } from '../models/product.model';
import { Store } from '../models/store.model';
import { User } from '../models/user.model';
import { httpError } from '../utils/httpError';
import { createSafeRegExp } from '../utils/regexp';

import type {
  StoreBankDetails,
  StoreFilterOptionsResponseDto,
  StoreResponseDto,
  StoreReviewResponseDto,
} from '../types/store';

//===============================================================

type StoresQuery = {
  page: number;
  perPage: number;
  keyword?: string;
  nameKeyword?: string;
  addressKeyword?: string;
  city?: string;
  sort?: 'newest' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc';
};

type CreateStoreReviewInput = {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
};

//===============================================================

type FavoriteStoreUserDocument = {
  favoriteStoreIds?: Array<Types.ObjectId | string>;
};

type StoreReviewDocument = {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  isModerated: boolean;
  moderatedAt?: Date;
  createdAt: Date;
};

type StoreDocument = {
  _id: Types.ObjectId;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: StoreBankDetails;
  status?: import('../types/store').ShopStatus;
  rating?: number;
  imageUrl?: string;
  description?: string;
  reviewsCount?: number;
  reviews?: StoreReviewDocument[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type StoreProductsCount = {
  _id: Types.ObjectId;
  count: number;
};

//===============================================================

const STORE_SORT_OPTIONS: StoreFilterOptionsResponseDto['sort'] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

//===============================================================

function getSort(sort: StoresQuery['sort']): Record<string, 1 | -1> {
  switch (sort) {
    case 'rating-desc':
      return { rating: -1, name: 1 };

    case 'rating-asc':
      return { rating: 1, name: 1 };

    case 'name-asc':
      return { name: 1 };

    case 'name-desc':
      return { name: -1 };

    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

function getModeratedStoreReviews(store: StoreDocument): StoreReviewDocument[] {
  return (store.reviews ?? []).filter((review) => review.isModerated);
}

//===============================================================

function hasCompleteBankDetails(
  bankDetails?: StoreBankDetails
): bankDetails is StoreBankDetails {
  return Boolean(
    bankDetails?.recipientName &&
      bankDetails.taxId &&
      bankDetails.iban &&
      bankDetails.bankName &&
      bankDetails.paymentPurpose
  );
}

//===============================================================

function getAverageRating(reviews: StoreReviewDocument[]): number | null {
  if (reviews.length === 0) return null;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

  return Number((totalRating / reviews.length).toFixed(1));
}

function serializeStoreReview(
  review: StoreReviewDocument
): StoreReviewResponseDto {
  return {
    id: review._id.toString(),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

function serializeStore(
  store: StoreDocument,
  productsCountMap = new Map<string, number>(),
  favoriteStoreIds = new Set<string>()
): StoreResponseDto {
  const storeId = store._id.toString();
  const moderatedReviews = getModeratedStoreReviews(store);
  const averageRating = getAverageRating(moderatedReviews);

  return {
    id: storeId,
    name: store.name,
    address: store.address,
    ...(store.city ? { city: store.city } : {}),
    ...(store.phone ? { phone: store.phone } : {}),
    ...(store.email ? { email: store.email } : {}),
    ...(store.workingHours ? { workingHours: store.workingHours } : {}),
    ...(hasCompleteBankDetails(store.bankDetails)
      ? { bankDetails: store.bankDetails }
      : {}),
    bankTransferAvailable: hasCompleteBankDetails(store.bankDetails),
    ...(store.status ? { status: store.status } : {}),
    ...(averageRating !== null
      ? { rating: averageRating }
      : typeof store.rating === 'number'
        ? { rating: store.rating }
        : {}),
    ...(store.imageUrl ? { imageUrl: store.imageUrl } : {}),
    ...(store.description ? { description: store.description } : {}),
    availableProductsCount: productsCountMap.get(storeId) ?? 0,
    reviewsCount: moderatedReviews.length,
    isFavorite: favoriteStoreIds.has(storeId),
    isActive: store.isActive,
    updatedAt: store.updatedAt.toISOString(),
  };
}

async function getAvailableProductsCountMap(storeIds: Types.ObjectId[]) {
  if (storeIds.length === 0) return new Map<string, number>();

  const counts = await Product.aggregate<StoreProductsCount>([
    {
      $match: {
        offers: {
          $elemMatch: {
            storeId: { $in: storeIds },
            inStock: true,
            activeQuantity: { $gt: 0 },
          },
        },
      },
    },
    { $unwind: '$offers' },
    {
      $match: {
        'offers.storeId': { $in: storeIds },
        'offers.inStock': true,
        'offers.activeQuantity': { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$offers.storeId',
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(counts.map((item) => [item._id.toString(), item.count]));
}

async function getFavoriteStoreIds(userId?: string): Promise<Set<string>> {
  if (!userId) return new Set();

  const user = await User.findById(userId)
    .select('favoriteStoreIds')
    .lean<FavoriteStoreUserDocument | null>();

  const favoriteStoreIds = user?.favoriteStoreIds ?? [];

  return new Set(favoriteStoreIds.map((id) => id.toString()));
}


//===============================================================

export async function getStoreFiltersService(): Promise<StoreFilterOptionsResponseDto> {
  const cities = (await Store.distinct('city', { isActive: true })) as string[];
  const normalizedCities = cities
    .filter(
      (city): city is string =>
        typeof city === 'string' && city.trim().length > 0
    )
    .map((city) => city.trim());
  const uniqueCities = [...new Set(normalizedCities)].sort((a, b) =>
    a.localeCompare(b, 'en')
  );

  return {
    cities: uniqueCities.map((city) => ({ value: city, label: city })),
    sort: STORE_SORT_OPTIONS,
  };
}

//===============================================================

export async function getStoresService(query: StoresQuery, userId?: string) {
  const {
    page,
    perPage,
    keyword,
    nameKeyword,
    addressKeyword,
    city,
    sort,
  } = query;

  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (city) filter.city = createSafeRegExp(city);
  if (nameKeyword) filter.name = createSafeRegExp(nameKeyword);
  if (addressKeyword) filter.address = createSafeRegExp(addressKeyword);

  if (keyword) {
    filter.$or = [
      { name: createSafeRegExp(keyword) },
      { address: createSafeRegExp(keyword) },
      { city: createSafeRegExp(keyword) },
    ];
  }

  const skip = (page - 1) * perPage;

  const [stores, total, favoriteStoreIds] = await Promise.all([
    Store.find(filter)
      .sort(getSort(sort))
      .skip(skip)
      .limit(perPage)
      .lean<StoreDocument[]>(),
    Store.countDocuments(filter),
    getFavoriteStoreIds(userId),
  ]);

  const productsCountMap = await getAvailableProductsCountMap(
    stores.map((store) => store._id)
  );

  return {
    items: stores.map((store) =>
      serializeStore(store, productsCountMap, favoriteStoreIds)
    ),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

//===============================================================

export async function getStoreDetailsService(storeId: string, userId?: string) {
  const [store, favoriteStoreIds] = await Promise.all([
    Store.findOne({
      _id: storeId,
      isActive: true,
    }).lean<StoreDocument | null>(),
    getFavoriteStoreIds(userId),
  ]);

  if (!store) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.STORE_NOT_FOUND);
  }

  const productsCountMap = await getAvailableProductsCountMap([store._id]);

  return {
    store: serializeStore(store, productsCountMap, favoriteStoreIds),
  };
}

//===============================================================

export async function getStoreReviewsService(storeId: string) {
  const store = await Store.findById(storeId)
    .select('reviews')
    .lean<StoreDocument | null>();

  if (!store) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.STORE_NOT_FOUND);
  }

  const reviews = (store.reviews ?? [])
    .filter((review) => review.isModerated)
    .sort((a, b) => {
      const aTime = (a.moderatedAt ?? a.createdAt).getTime();
      const bTime = (b.moderatedAt ?? b.createdAt).getTime();

      return bTime - aTime;
    });

  return {
    items: reviews.map((review) => serializeStoreReview(review)),
    total: reviews.length,
  };
}

//===============================================================

export async function createStoreReviewService(
  storeId: string,
  input: CreateStoreReviewInput
) {
  const store = await Store.findById(storeId).select('_id');

  if (!store) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.STORE_NOT_FOUND);
  }

  await Store.updateOne(
    { _id: storeId },
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

export async function toggleFavoriteStoreService(storeId: string, userId: string) {
  const store = await Store.exists({ _id: storeId, isActive: true });

  if (!store) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.STORE_NOT_FOUND);
  }

  const user = await User.findById(userId)
    .select('favoriteStoreIds')
    .lean<FavoriteStoreUserDocument | null>();

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  const favoriteIds = (user.favoriteStoreIds ?? []).map((id) => id.toString());
  const isFavorite = favoriteIds.includes(storeId);

  if (isFavorite) {
    await User.updateOne(
      { _id: userId },
      { $pull: { favoriteStoreIds: storeId } }
    );

    return {
      isFavorite: false,
      message: 'Store was removed from favorites.',
    };
  }

  await User.updateOne(
    { _id: userId },
    { $addToSet: { favoriteStoreIds: storeId } }
  );

  return {
    isFavorite: true,
    message: 'Store was added to favorites.',
  };
}
