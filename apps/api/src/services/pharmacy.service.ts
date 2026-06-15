import { Types } from 'mongoose';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Product } from '../models/product.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { httpError } from '../utils/httpError';
import { createSafeRegExp } from '../utils/regexp';

import type {
  PharmacyBankDetails,
  PharmacyFilterOptionsResponseDto,
  PharmacyResponseDto,
  PharmacyReviewResponseDto,
  ReviewModerationStatus,
} from '../types/pharmacy';

//===============================================================

type PharmaciesQuery = {
  page: number;
  perPage: number;
  keyword?: string;
  nameKeyword?: string;
  addressKeyword?: string;
  city?: string;
  sort?: 'newest' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc';
};

type CreatePharmacyReviewInput = {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
};

//===============================================================

type FavoritePharmacyUserDocument = {
  favoritePharmacyIds?: Array<Types.ObjectId | string>;
};

type PharmacyReviewDocument = {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  status?: ReviewModerationStatus;
  isModerated: boolean;
  moderationReason?: string;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
};

type PendingPharmacyReviewResponseDto = {
  pharmacyId: string;
  pharmacyName: string;
  reviewId: string;
  userName: string;
  rating: number;
  comment: string;
  status: ReviewModerationStatus;
  createdAt: string;
};

type PendingReviewsQuery = {
  page: number;
  perPage: number;
};

type PharmacyDocument = {
  _id: Types.ObjectId;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  bankDetails?: PharmacyBankDetails;
  status?: import('../types/pharmacy').PharmacyStatus;
  rating?: number;
  imageUrl?: string;
  description?: string;
  reviewsCount?: number;
  reviews?: PharmacyReviewDocument[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PharmacyProductsCount = {
  _id: Types.ObjectId;
  count: number;
};

//===============================================================

const PHARMACY_SORT_OPTIONS: PharmacyFilterOptionsResponseDto['sort'] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

//===============================================================

function getSort(sort: PharmaciesQuery['sort']): Record<string, 1 | -1> {
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

function getModeratedPharmacyReviews(pharmacy: PharmacyDocument): PharmacyReviewDocument[] {
  return (pharmacy.reviews ?? []).filter(
    (review) => review.status === 'approved' || review.isModerated
  );
}

//===============================================================

function hasCompleteBankDetails(
  bankDetails?: PharmacyBankDetails
): bankDetails is PharmacyBankDetails {
  return Boolean(
    bankDetails?.recipientName &&
      bankDetails.taxId &&
      bankDetails.iban &&
      bankDetails.bankName &&
      bankDetails.paymentPurpose
  );
}

//===============================================================

function getAverageRating(reviews: PharmacyReviewDocument[]): number | null {
  if (reviews.length === 0) return null;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

  return Number((totalRating / reviews.length).toFixed(1));
}

function serializePharmacyReview(
  review: PharmacyReviewDocument
): PharmacyReviewResponseDto {
  return {
    id: review._id.toString(),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

function isPendingPharmacyReview(review: PharmacyReviewDocument): boolean {
  return review.status === 'pending' || (!review.status && !review.isModerated);
}

function serializePendingPharmacyReview(
  pharmacy: Pick<PharmacyDocument, '_id' | 'name'>,
  review: PharmacyReviewDocument
): PendingPharmacyReviewResponseDto {
  return {
    pharmacyId: pharmacy._id.toString(),
    pharmacyName: pharmacy.name,
    reviewId: review._id.toString(),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    status: review.status ?? 'pending',
    createdAt: review.createdAt.toISOString(),
  };
}

function serializePharmacy(
  pharmacy: PharmacyDocument,
  productsCountMap = new Map<string, number>(),
  favoritePharmacyIds = new Set<string>()
): PharmacyResponseDto {
  const pharmacyId = pharmacy._id.toString();
  const moderatedReviews = getModeratedPharmacyReviews(pharmacy);
  const averageRating = getAverageRating(moderatedReviews);

  return {
    id: pharmacyId,
    name: pharmacy.name,
    address: pharmacy.address,
    ...(pharmacy.city ? { city: pharmacy.city } : {}),
    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
    ...(pharmacy.email ? { email: pharmacy.email } : {}),
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
    ...(hasCompleteBankDetails(pharmacy.bankDetails)
      ? { bankDetails: pharmacy.bankDetails }
      : {}),
    bankTransferAvailable: hasCompleteBankDetails(pharmacy.bankDetails),
    ...(pharmacy.status ? { status: pharmacy.status } : {}),
    ...(averageRating !== null
      ? { rating: averageRating }
      : typeof pharmacy.rating === 'number'
        ? { rating: pharmacy.rating }
        : {}),
    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    ...(pharmacy.description ? { description: pharmacy.description } : {}),
    availableProductsCount: productsCountMap.get(pharmacyId) ?? 0,
    reviewsCount: moderatedReviews.length,
    isFavorite: favoritePharmacyIds.has(pharmacyId),
    isActive: pharmacy.isActive,
    updatedAt: pharmacy.updatedAt.toISOString(),
  };
}

async function getAvailableProductsCountMap(pharmacyIds: Types.ObjectId[]) {
  if (pharmacyIds.length === 0) return new Map<string, number>();

  const counts = await Product.aggregate<PharmacyProductsCount>([
    {
      $match: {
        offers: {
          $elemMatch: {
            pharmacyId: { $in: pharmacyIds },
            inStock: true,
            activeQuantity: { $gt: 0 },
          },
        },
      },
    },
    { $unwind: '$offers' },
    {
      $match: {
        'offers.pharmacyId': { $in: pharmacyIds },
        'offers.inStock': true,
        'offers.activeQuantity': { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$offers.pharmacyId',
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(counts.map((item) => [item._id.toString(), item.count]));
}

async function getFavoritePharmacyIds(userId?: string): Promise<Set<string>> {
  if (!userId) return new Set();

  const user = await User.findById(userId)
    .select('favoritePharmacyIds')
    .lean<FavoritePharmacyUserDocument | null>();

  const favoritePharmacyIds = user?.favoritePharmacyIds ?? [];

  return new Set(favoritePharmacyIds.map((id) => id.toString()));
}


//===============================================================

export async function getPharmacyFiltersService(): Promise<PharmacyFilterOptionsResponseDto> {
  const cities = (await Pharmacy.distinct('city', { isActive: true })) as string[];
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
    sort: PHARMACY_SORT_OPTIONS,
  };
}

//===============================================================

export async function getPharmaciesService(query: PharmaciesQuery, userId?: string) {
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

  const [pharmacies, total, favoritePharmacyIds] = await Promise.all([
    Pharmacy.find(filter)
      .sort(getSort(sort))
      .skip(skip)
      .limit(perPage)
      .lean<PharmacyDocument[]>(),
    Pharmacy.countDocuments(filter),
    getFavoritePharmacyIds(userId),
  ]);

  const productsCountMap = await getAvailableProductsCountMap(
    pharmacies.map((pharmacy) => pharmacy._id)
  );

  return {
    items: pharmacies.map((pharmacy) =>
      serializePharmacy(pharmacy, productsCountMap, favoritePharmacyIds)
    ),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

//===============================================================

export async function getPharmacyDetailsService(pharmacyId: string, userId?: string) {
  const [pharmacy, favoritePharmacyIds] = await Promise.all([
    Pharmacy.findOne({
      _id: pharmacyId,
      isActive: true,
    }).lean<PharmacyDocument | null>(),
    getFavoritePharmacyIds(userId),
  ]);

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  const productsCountMap = await getAvailableProductsCountMap([pharmacy._id]);

  return {
    pharmacy: serializePharmacy(pharmacy, productsCountMap, favoritePharmacyIds),
  };
}

//===============================================================

export async function getPharmacyReviewsService(pharmacyId: string) {
  const pharmacy = await Pharmacy.findById(pharmacyId)
    .select('reviews')
    .lean<PharmacyDocument | null>();

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  const reviews = (pharmacy.reviews ?? [])
    .filter((review) => review.status === 'approved' || review.isModerated)
    .sort((a, b) => {
      const aTime = (a.moderatedAt ?? a.createdAt).getTime();
      const bTime = (b.moderatedAt ?? b.createdAt).getTime();

      return bTime - aTime;
    });

  return {
    items: reviews.map((review) => serializePharmacyReview(review)),
    total: reviews.length,
  };
}

//===============================================================

export async function createPharmacyReviewService(
  pharmacyId: string,
  input: CreatePharmacyReviewInput
) {
  const pharmacy = await Pharmacy.findById(pharmacyId).select('_id');

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  await Pharmacy.updateOne(
    { _id: pharmacyId },
    {
      $push: {
        reviews: {
          userId: input.userId,
          userName: input.userName,
          rating: input.rating,
          comment: input.comment,
          status: 'pending',
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


export async function getPendingPharmacyReviewsService(query: PendingReviewsQuery) {
  const pharmacies = await Pharmacy.find({
    reviews: { $elemMatch: { $or: [{ status: 'pending' }, { status: { $exists: false }, isModerated: false }] } },
  })
    .select('name reviews')
    .lean<PharmacyDocument[]>();

  const pendingReviews = pharmacies
    .flatMap((pharmacy) =>
      (pharmacy.reviews ?? [])
        .filter(isPendingPharmacyReview)
        .map((review) => serializePendingPharmacyReview(pharmacy, review))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const start = (query.page - 1) * query.perPage;
  const items = pendingReviews.slice(start, start + query.perPage);

  return {
    items,
    page: query.page,
    perPage: query.perPage,
    total: pendingReviews.length,
    totalPages: Math.ceil(pendingReviews.length / query.perPage),
  };
}

//===============================================================

export async function moderatePharmacyReviewService(
  pharmacyId: string,
  reviewId: string,
  input: {
    status: Extract<ReviewModerationStatus, 'approved' | 'rejected'>;
    reason?: string;
    moderatedBy?: string;
  }
) {
  const moderatedAt = new Date();
  const updateResult = await Pharmacy.updateOne(
    { _id: pharmacyId, 'reviews._id': reviewId },
    {
      $set: {
        'reviews.$.status': input.status,
        'reviews.$.isModerated': input.status === 'approved',
        'reviews.$.moderationReason': input.reason,
        'reviews.$.moderatedBy': input.moderatedBy
          ? new Types.ObjectId(input.moderatedBy)
          : undefined,
        'reviews.$.moderatedAt': moderatedAt,
      },
    }
  );

  if (updateResult.matchedCount === 0) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy review was not found.');
  }

  const pharmacy = await Pharmacy.findById(pharmacyId)
    .select('reviews')
    .lean<PharmacyDocument | null>();

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  const moderatedReviews = getModeratedPharmacyReviews(pharmacy);
  const averageRating = getAverageRating(moderatedReviews) ?? 0;

  await Pharmacy.updateOne(
    { _id: pharmacyId },
    {
      $set: {
        rating: averageRating,
        reviewsCount: moderatedReviews.length,
      },
    }
  );

  return {
    message:
      input.status === 'approved'
        ? 'Pharmacy review was approved.'
        : 'Pharmacy review was rejected.',
    rating: averageRating,
    reviewsCount: moderatedReviews.length,
    moderatedAt: moderatedAt.toISOString(),
  };
}

//===============================================================

export async function toggleFavoritePharmacyService(pharmacyId: string, userId: string) {
  const pharmacy = await Pharmacy.exists({ _id: pharmacyId, isActive: true });

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  const user = await User.findById(userId)
    .select('favoritePharmacyIds')
    .lean<FavoritePharmacyUserDocument | null>();

  if (!user) {
    throw httpError(HTTP_STATUS.UNAUTHORIZED, API_MESSAGES.USER_NOT_FOUND);
  }

  const favoriteIds = (user.favoritePharmacyIds ?? []).map((id) => id.toString());
  const isFavorite = favoriteIds.includes(pharmacyId);

  if (isFavorite) {
    await User.updateOne(
      { _id: userId },
      { $pull: { favoritePharmacyIds: pharmacyId } }
    );

    return {
      isFavorite: false,
      message: 'Pharmacy was removed from favorites.',
    };
  }

  await User.updateOne(
    { _id: userId },
    { $addToSet: { favoritePharmacyIds: pharmacyId } }
  );

  return {
    isFavorite: true,
    message: 'Pharmacy was added to favorites.',
  };
}
