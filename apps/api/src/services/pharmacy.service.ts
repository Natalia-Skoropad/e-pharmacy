import { Types } from 'mongoose';

import { PHARMACY_STATUSES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';

import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyReview } from '../models/pharmacyReview.model';
import { ProductOffer } from '../models/productOffer.model';

import type {
  PharmacyBankDetails,
  PharmacyEntity,
  PharmacyFilterOptionsResponseDto,
  PublicPharmacyResponseDto,
  PharmacyReviewResponseDto,
  ReviewModerationStatus,
} from '../types/pharmacy';

import { httpError } from '../utils/httpError';
import { createSafeRegExp } from '../utils/regexp';

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

type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };
type PendingReviewsQuery = { page: number; perPage: number };

type CreateReviewInput = {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
};

type PendingReviewDto = {
  pharmacyId: string;
  pharmacyName: string;
  reviewId: string;
  userName: string;
  rating: number;
  comment: string;
  status: ReviewModerationStatus;
  createdAt: string;
};

//===============================================================

function hasCompleteBankDetails(
  details?: Partial<PharmacyBankDetails> | null
): boolean {
  return Boolean(
    details?.recipientName &&
    details?.taxId &&
    details?.iban &&
    details?.bankName &&
    details?.paymentPurpose
  );
}

//===============================================================

async function getFavoritePharmacyIds(userId?: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const client = await Client.findOne({ userId })
    .select('favoritePharmacyIds')
    .lean<{ favoritePharmacyIds?: Types.ObjectId[] } | null>();
  return new Set((client?.favoritePharmacyIds ?? []).map(String));
}

//===============================================================

async function getAvailableProductsCountMap(pharmacyIds: Types.ObjectId[]) {
  const rows = await ProductOffer.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    {
      $match: {
        pharmacyId: { $in: pharmacyIds },
        availableQuantity: { $gt: 0 },
      },
    },
    { $group: { _id: '$pharmacyId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

//===============================================================

function serializePublicPharmacy(
  pharmacy: PharmacyDocument,
  availableProductsCount: number,
  favoriteIds: Set<string>
): PublicPharmacyResponseDto {
  return {
    id: String(pharmacy._id),
    name: pharmacy.name,
    address: pharmacy.address,
    ...(pharmacy.city ? { city: pharmacy.city } : {}),
    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
    ...(pharmacy.email ? { email: pharmacy.email } : {}),
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
    bankTransferAvailable: hasCompleteBankDetails(pharmacy.bankDetails),
    rating: pharmacy.rating ?? 0,
    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    ...(pharmacy.description ? { description: pharmacy.description } : {}),
    availableProductsCount,
    reviewsCount: pharmacy.reviewsCount ?? 0,
    isFavorite: favoriteIds.has(String(pharmacy._id)),
    updatedAt:
      pharmacy.updatedAt?.toISOString?.() ?? String(pharmacy.updatedAt ?? ''),
  };
}

//===============================================================

export async function getPharmacyFiltersService(): Promise<PharmacyFilterOptionsResponseDto> {
  const cities = await Pharmacy.distinct('city', {
    status: {
      $in: [PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.ON_MODERATION],
    },
    city: { $type: 'string', $ne: '' },
  });
  return {
    cities: cities.sort().map((value) => ({ value, label: value })),
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

export async function getPharmacyOptionsService() {
  const pharmacies = await Pharmacy.find({
    status: {
      $in: [PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.ON_MODERATION],
    },
  })
    .select('_id name')
    .sort({ name: 1 })
    .lean<Array<{ _id: Types.ObjectId; name: string }>>();

  return {
    items: pharmacies.map((pharmacy) => ({
      id: String(pharmacy._id),
      name: pharmacy.name,
    })),
  };
}


//===============================================================

export async function getFavoritePharmacyIdsService(userId: string) {
  const client = await Client.findOne({ userId })
    .select('favoritePharmacyIds')
    .lean<{ favoritePharmacyIds?: Types.ObjectId[] } | null>();

  return {
    ids: (client?.favoritePharmacyIds ?? []).map(String),
  };
}

//===============================================================

export async function getFavoritePharmaciesService(
  query: PharmaciesQuery,
  userId: string
) {
  const client = await Client.findOne({ userId })
    .select('favoritePharmacyIds')
    .lean<{ favoritePharmacyIds?: Types.ObjectId[] } | null>();

  const favoriteIdsArray = client?.favoritePharmacyIds ?? [];
  const favoriteIds = new Set(favoriteIdsArray.map(String));
  const filter = {
    _id: { $in: favoriteIdsArray },
    status: {
      $in: [PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.ON_MODERATION],
    },
  };
  const sort: Record<string, 1 | -1> =
    query.sort === 'name-desc' ? { name: -1 } : { name: 1 };
  const skip = (query.page - 1) * query.perPage;

  const [pharmacies, total] = await Promise.all([
    Pharmacy.find(filter).sort(sort).skip(skip).limit(query.perPage).lean(),
    Pharmacy.countDocuments(filter),
  ]);
  const countMap = await getAvailableProductsCountMap(
    pharmacies.map((pharmacy) => pharmacy._id)
  );

  return {
    items: pharmacies.map((pharmacy) =>
      serializePublicPharmacy(
        pharmacy,
        countMap.get(String(pharmacy._id)) ?? 0,
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

export async function getPharmaciesService(
  query: PharmaciesQuery,
  userId?: string
) {
  const filter: Record<string, unknown> = {
    status: {
      $in: [PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.ON_MODERATION],
    },
  };
  if (query.keyword) {
    filter.$or = [
      { name: createSafeRegExp(query.keyword) },
      { address: createSafeRegExp(query.keyword) },
      { city: createSafeRegExp(query.keyword) },
    ];
  }

  if (query.nameKeyword) {
    filter.name = createSafeRegExp(query.nameKeyword);
  }

  if (query.addressKeyword) {
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),
      {
        $or: [
          { address: createSafeRegExp(query.addressKeyword) },
          { city: createSafeRegExp(query.addressKeyword) },
        ],
      },
    ];
  }

  if (query.city) filter.city = query.city;
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
  const [pharmacies, total, favoriteIds] = await Promise.all([
    Pharmacy.find(filter).sort(sort).skip(skip).limit(query.perPage).lean(),
    Pharmacy.countDocuments(filter),
    getFavoritePharmacyIds(userId),
  ]);
  const countMap = await getAvailableProductsCountMap(
    pharmacies.map((pharmacy) => pharmacy._id)
  );
  return {
    items: pharmacies.map((pharmacy) =>
      serializePublicPharmacy(
        pharmacy,
        countMap.get(String(pharmacy._id)) ?? 0,
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

export async function getPharmacyDetailsService(
  pharmacyId: string,
  userId?: string
) {
  const pharmacy = await Pharmacy.findOne({
    _id: pharmacyId,
    status: {
      $in: [PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.ON_MODERATION],
    },
  }).lean();
  if (!pharmacy)
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  const [favoriteIds, countMap] = await Promise.all([
    getFavoritePharmacyIds(userId),
    getAvailableProductsCountMap([pharmacy._id]),
  ]);
  return {
    pharmacy: serializePublicPharmacy(
      pharmacy,
      countMap.get(String(pharmacy._id)) ?? 0,
      favoriteIds
    ),
  };
}

//===============================================================


export async function getPharmacyCheckoutDetailsService(pharmacyId: string) {
  const pharmacy = await Pharmacy.findOne({
    _id: pharmacyId,
    status: {
      $in: [PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.ON_MODERATION],
    },
  })
    .select('name address city phone email workingHours bankDetails')
    .lean<
      | (Pick<
          PharmacyDocument,
          | '_id'
          | 'name'
          | 'address'
          | 'city'
          | 'phone'
          | 'email'
          | 'workingHours'
          | 'bankDetails'
        >)
      | null
    >();

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  return {
    pharmacy: {
      id: String(pharmacy._id),
      name: pharmacy.name,
      ...(pharmacy.address ? { address: pharmacy.address } : {}),
      ...(pharmacy.city ? { city: pharmacy.city } : {}),
      ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
      ...(pharmacy.email ? { email: pharmacy.email } : {}),
      ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
      bankTransferAvailable: hasCompleteBankDetails(pharmacy.bankDetails),
      ...(hasCompleteBankDetails(pharmacy.bankDetails)
        ? { bankDetails: pharmacy.bankDetails }
        : {}),
    },
  };
}

//===============================================================

export async function getPharmacyReviewsService(pharmacyId: string) {
  const exists = await Pharmacy.exists({
    _id: pharmacyId,
    status: {
      $in: [PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.ON_MODERATION],
    },
  });
  if (!exists)
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  const reviews = await PharmacyReview.find({ pharmacyId, status: 'approved' })
    .sort({ createdAt: -1 })
    .lean();
  const items: PharmacyReviewResponseDto[] = reviews.map((review) => ({
    id: String(review._id),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  }));
  return { items, total: items.length };
}

//===============================================================

export async function createPharmacyReviewService(
  pharmacyId: string,
  input: CreateReviewInput
) {
  const exists = await Pharmacy.exists({
    _id: pharmacyId,
    status: {
      $in: [PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.ON_MODERATION],
    },
  });
  if (!exists)
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  await PharmacyReview.create({
    pharmacyId,
    userId: input.userId,
    userName: input.userName,
    rating: input.rating,
    comment: input.comment,
    status: 'on_moderation',
  });
  return { message: 'Pharmacy review was submitted for moderation.' };
}

//===============================================================

export async function getPendingPharmacyReviewsService(
  query: PendingReviewsQuery
) {
  const skip = (query.page - 1) * query.perPage;
  const [reviews, total] = await Promise.all([
    PharmacyReview.find({ status: 'on_moderation' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.perPage)
      .lean(),
    PharmacyReview.countDocuments({ status: 'on_moderation' }),
  ]);
  const pharmacies = await Pharmacy.find({
    _id: { $in: reviews.map((review) => review.pharmacyId) },
  })
    .select('name')
    .lean();
  const names = new Map(
    pharmacies.map((pharmacy) => [String(pharmacy._id), pharmacy.name])
  );
  const items: PendingReviewDto[] = reviews.map((review) => ({
    pharmacyId: String(review.pharmacyId),
    pharmacyName: names.get(String(review.pharmacyId)) ?? 'Pharmacy',
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

export async function moderatePharmacyReviewService(
  pharmacyId: string,
  reviewId: string,
  input: {
    status: 'approved' | 'rejected';
    reason?: string;
    moderatorId: string;
  }
) {
  const review = await PharmacyReview.findOneAndUpdate(
    { _id: reviewId, pharmacyId },
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

  if (!review)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy review was not found.');
  const approved = await PharmacyReview.find({ pharmacyId, status: 'approved' })
    .select('rating')
    .lean();
  const rating = approved.length
    ? Number(
        (
          approved.reduce((sum, item) => sum + item.rating, 0) / approved.length
        ).toFixed(1)
      )
    : 0;
  await Pharmacy.updateOne(
    { _id: pharmacyId },
    { $set: { rating, reviewsCount: approved.length } }
  );

  return {
    message:
      input.status === 'approved'
        ? 'Pharmacy review was approved.'
        : 'Pharmacy review was rejected.',
    rating,
    reviewsCount: approved.length,
    moderatedAt: review.moderatedAt?.toISOString(),
  };
}

//===============================================================

export async function setFavoritePharmacyService(
  pharmacyId: string,
  userId: string,
  isFavorite: boolean
) {
  const exists = await Pharmacy.exists({
    _id: pharmacyId,
    status: {
      $in: [PHARMACY_STATUSES.ACTIVE, PHARMACY_STATUSES.ON_MODERATION],
    },
  });

  if (!exists)
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);

  await Client.updateOne(
    { userId },
    isFavorite
      ? {
          $setOnInsert: { userId },
          $addToSet: { favoritePharmacyIds: pharmacyId },
        }
      : { $pull: { favoritePharmacyIds: pharmacyId } },
    { upsert: isFavorite }
  );

  return {
    isFavorite,
    message: isFavorite
      ? 'Pharmacy was added to favorites.'
      : 'Pharmacy was removed from favorites.',
  };
}
