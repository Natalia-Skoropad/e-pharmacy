import { Types, type HydratedDocument } from 'mongoose';

import { PHARMACY_STATUSES, USER_ROLES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';

import { Client } from '../models/client.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { PharmacyReview } from '../models/pharmacyReview.model';
import { ProductOffer } from '../models/productOffer.model';

import type {
  CompletePharmacyBankDetails,
  EditablePharmacyBankDetails,
  PharmacyEntity,
  PharmacyFilterOptionsResponseDto,
  PharmacyPendingModeration,
  PublicPharmacyResponseDto,
  PharmacyProfileResponseDto,
  PharmacyReviewResponseDto,
  ReviewModerationStatus,
  UpdateMyPharmacyProfileInput,
} from '../types/pharmacy';

import { httpError } from '../utils/httpError';
import { createSafeRegExp } from '../utils/regexp';
import { requireISODateTime } from '../utils/date-contract';

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

type PharmacyHydratedDocument = HydratedDocument<PharmacyEntity> & {
  _id: Types.ObjectId;
};

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

const PUBLIC_PHARMACY_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

const PUBLIC_PHARMACY_STATUS_FILTER = {
  $in: [...PUBLIC_PHARMACY_STATUSES],
};

//===============================================================

function hasCompleteBankDetails(
  details?: EditablePharmacyBankDetails | null
): details is CompletePharmacyBankDetails {
  return Boolean(
    details?.recipientName &&
    details?.taxId &&
    details?.iban &&
    details?.bankName &&
    details?.receiptEmail &&
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
  favoriteIds: Set<string>,
  options: { includeBankDetails?: boolean } = {}
): PublicPharmacyResponseDto {
  const completeBankDetails = hasCompleteBankDetails(pharmacy.bankDetails)
    ? pharmacy.bankDetails
    : null;
  const shouldIncludeBankDetails =
    Boolean(options.includeBankDetails) && Boolean(completeBankDetails);

  return {
    id: String(pharmacy._id),
    name: pharmacy.name,
    ...(pharmacy.address ? { address: pharmacy.address } : {}),
    ...(pharmacy.city ? { city: pharmacy.city } : {}),
    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
    ...(pharmacy.email ? { email: pharmacy.email } : {}),
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
    bankTransferAvailable: hasCompleteBankDetails(pharmacy.bankDetails),
    ...(shouldIncludeBankDetails && completeBankDetails
      ? { bankDetails: completeBankDetails }
      : {}),
    rating: pharmacy.rating ?? 0,
    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    ...(pharmacy.description ? { description: pharmacy.description } : {}),
    availableProductsCount,
    reviewsCount: pharmacy.reviewsCount ?? 0,
    isFavorite: favoriteIds.has(String(pharmacy._id)),
    updatedAt: requireISODateTime(pharmacy.updatedAt, 'pharmacy.updatedAt'),
  };
}

//===============================================================

function serializePharmacyProfile(
  pharmacy: PharmacyDocument
): PharmacyProfileResponseDto {
  return {
    id: String(pharmacy._id),
    name: pharmacy.name,
    ...(pharmacy.address ? { address: pharmacy.address } : {}),
    ...(pharmacy.city ? { city: pharmacy.city } : {}),
    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
    ...(pharmacy.email ? { email: pharmacy.email } : {}),
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
    bankTransferAvailable: hasCompleteBankDetails(pharmacy.bankDetails),
    ...(pharmacy.bankDetails ? { bankDetails: pharmacy.bankDetails } : {}),
    documents: pharmacy.documents ?? [],
    status: pharmacy.status,
    rating: pharmacy.rating ?? 0,
    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    ...(pharmacy.description ? { description: pharmacy.description } : {}),
    ...(pharmacy.statusReason ? { statusReason: pharmacy.statusReason } : {}),
    ...(pharmacy.pendingModeration
      ? { pendingModeration: pharmacy.pendingModeration }
      : {}),
    reviewsCount: pharmacy.reviewsCount ?? 0,
    updatedAt: requireISODateTime(pharmacy.updatedAt, 'pharmacy.updatedAt'),
  };
}

//===============================================================

export async function getPharmacyFiltersService(): Promise<PharmacyFilterOptionsResponseDto> {
  const cities = await Pharmacy.distinct('city', {
    status: PUBLIC_PHARMACY_STATUS_FILTER,
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
    status: PUBLIC_PHARMACY_STATUS_FILTER,
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
    status: PUBLIC_PHARMACY_STATUS_FILTER,
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
    status: PUBLIC_PHARMACY_STATUS_FILTER,
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
    status: PUBLIC_PHARMACY_STATUS_FILTER,
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
      favoriteIds,
      { includeBankDetails: Boolean(userId) }
    ),
  };
}

//===============================================================

export async function getPharmacyCheckoutDetailsService(pharmacyId: string) {
  const pharmacy = await Pharmacy.findOne({
    _id: pharmacyId,
    status: PUBLIC_PHARMACY_STATUS_FILTER,
  })
    .select('name address city phone email workingHours bankDetails')
    .lean<Pick<
      PharmacyDocument,
      | '_id'
      | 'name'
      | 'address'
      | 'city'
      | 'phone'
      | 'email'
      | 'workingHours'
      | 'bankDetails'
    > | null>();

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
    status: PUBLIC_PHARMACY_STATUS_FILTER,
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
    status: PUBLIC_PHARMACY_STATUS_FILTER,
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
    status: PUBLIC_PHARMACY_STATUS_FILTER,
  });

  if (!exists)
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);

  const result = await Client.updateOne(
    { userId },
    isFavorite
      ? { $addToSet: { favoritePharmacyIds: pharmacyId } }
      : { $pull: { favoritePharmacyIds: pharmacyId } }
  );

  if (result.matchedCount === 0) {
    throw httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.FORBIDDEN_ROLE);
  }

  return {
    isFavorite,
    message: isFavorite
      ? 'Pharmacy was added to favorites.'
      : 'Pharmacy was removed from favorites.',
  };
}

//===============================================================

async function createMissingOwnerPharmacyProfile(
  userId: string
): Promise<PharmacyHydratedDocument | null> {
  const user = await User.findById(userId);

  if (!user || user.role !== USER_ROLES.PHARMACY) {
    return null;
  }

  const pharmacy = await Pharmacy.findOneAndUpdate(
    { ownerId: user._id },
    {
      $setOnInsert: {
        ownerId: user._id,
        managerUserIds: [],
        name: '',
        phone: user.phone,
        email: user.email,
        ...(user.address ? { address: user.address } : {}),
        documents: [],
        status: PHARMACY_STATUSES.NEW,
        createdBy: user._id,
        updatedBy: user._id,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );

  return pharmacy as PharmacyHydratedDocument;
}

//===============================================================

async function findMyPharmacy(
  userId: string
): Promise<PharmacyHydratedDocument> {
  const pharmacy =
    (await Pharmacy.findOne({
      $or: [{ ownerId: userId }, { managerUserIds: userId }],
    })) ?? (await createMissingOwnerPharmacyProfile(userId));

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  if (pharmacy.status === PHARMACY_STATUSES.BLOCKED) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Pharmacy is blocked.');
  }

  return pharmacy as PharmacyHydratedDocument;
}

//===============================================================

function assertReadyForVerification(pharmacy: PharmacyHydratedDocument): void {
  const bankDetails = pharmacy.bankDetails;
  const requiredFields: Record<string, unknown> = {
    name: pharmacy.name,
    address: pharmacy.address,
    phone: pharmacy.phone,
    email: pharmacy.email,
    workingHours: pharmacy.workingHours,
    imageUrl: pharmacy.imageUrl,
    description: pharmacy.description,
    recipientName: bankDetails?.recipientName,
    taxId: bankDetails?.taxId,
    iban: bankDetails?.iban,
    bankName: bankDetails?.bankName,
    receiptEmail: bankDetails?.receiptEmail,
    paymentPurpose: bankDetails?.paymentPurpose,
    documents: pharmacy.documents?.length,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Complete pharmacy profile before verification.',
      {
        missingFields,
      }
    );
  }
}

//===============================================================

export async function getMyPharmacyProfileService(
  userId: string
): Promise<{ pharmacy: PharmacyProfileResponseDto }> {
  const pharmacy = await findMyPharmacy(userId);

  return {
    pharmacy: serializePharmacyProfile(pharmacy),
  };
}

//===============================================================

function hasModeratedProfileChanges(
  input: UpdateMyPharmacyProfileInput
): boolean {
  return Boolean(
    input.name !== undefined ||
    input.address !== undefined ||
    input.city !== undefined ||
    input.phone !== undefined ||
    input.email !== undefined ||
    input.workingHours !== undefined ||
    input.imageUrl !== undefined ||
    input.description !== undefined ||
    input.documents !== undefined ||
    input.bankDetails
  );
}

//===============================================================

function buildPendingModerationPayload(
  current: PharmacyPendingModeration | undefined,
  input: UpdateMyPharmacyProfileInput
): PharmacyPendingModeration {
  const pending: PharmacyPendingModeration = { ...(current ?? {}) };

  if (input.name !== undefined) pending.name = input.name;
  if (input.address !== undefined) pending.address = input.address;
  if (input.city !== undefined) pending.city = input.city;
  if (input.phone !== undefined) pending.phone = input.phone;
  if (input.email !== undefined) pending.email = input.email;
  if (input.workingHours !== undefined)
    pending.workingHours = input.workingHours;
  if (input.imageUrl !== undefined) pending.imageUrl = input.imageUrl;
  if (input.description !== undefined) pending.description = input.description;
  if (input.documents !== undefined) pending.documents = input.documents;

  if (input.bankDetails) {
    pending.bankDetails = {
      ...(pending.bankDetails ?? {}),
      ...input.bankDetails,
    };
  }

  return pending;
}

//===============================================================

export async function updateMyPharmacyProfileService(
  userId: string,
  input: UpdateMyPharmacyProfileInput
): Promise<{ pharmacy: PharmacyProfileResponseDto }> {
  const pharmacy = await findMyPharmacy(userId);

  if (
    pharmacy.status === PHARMACY_STATUSES.ON_VERIFICATION ||
    pharmacy.status === PHARMACY_STATUSES.ON_MODERATION
  ) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Profile fields are locked until Admin reviews the submitted pharmacy data.'
    );
  }

  if (
    pharmacy.status === PHARMACY_STATUSES.ACTIVE &&
    hasModeratedProfileChanges(input)
  ) {
    const pendingModeration = buildPendingModerationPayload(
      pharmacy.pendingModeration,
      input
    );

    const updatedPharmacy = await Pharmacy.findByIdAndUpdate(
      pharmacy._id,
      {
        $set: {
          pendingModeration,
          updatedBy: userId,
        },
        $unset: { statusReason: '' },
      },
      { new: true, runValidators: true }
    );

    if (!updatedPharmacy) {
      throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
    }

    return {
      pharmacy: serializePharmacyProfile(updatedPharmacy as PharmacyDocument),
    };
  }

  const update: Record<string, unknown> = {
    updatedBy: userId,
  };

  if (input.name !== undefined) update.name = input.name;
  if (input.address !== undefined) update.address = input.address;
  if (input.city !== undefined) update.city = input.city;
  if (input.phone !== undefined) update.phone = input.phone;
  if (input.email !== undefined) update.email = input.email;
  if (input.workingHours !== undefined)
    update.workingHours = input.workingHours;
  if (input.imageUrl !== undefined) update.imageUrl = input.imageUrl;
  if (input.description !== undefined) update.description = input.description;
  if (input.documents !== undefined) update.documents = input.documents;

  if (input.bankDetails) {
    for (const [key, value] of Object.entries(input.bankDetails)) {
      if (value !== undefined) {
        update[`bankDetails.${key}`] = value;
      }
    }
  }

  const updatedPharmacy = await Pharmacy.findByIdAndUpdate(
    pharmacy._id,
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!updatedPharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  return {
    pharmacy: serializePharmacyProfile(updatedPharmacy as PharmacyDocument),
  };
}

//===============================================================

export async function sendMyPharmacyForVerificationService(
  userId: string
): Promise<{ pharmacy: PharmacyProfileResponseDto; message: string }> {
  const pharmacy = await findMyPharmacy(userId);

  if (pharmacy.status === PHARMACY_STATUSES.NEW) {
    assertReadyForVerification(pharmacy);
    pharmacy.status = PHARMACY_STATUSES.ON_VERIFICATION;
    pharmacy.statusReason = undefined;
  } else if (pharmacy.status === PHARMACY_STATUSES.ACTIVE) {
    if (
      !pharmacy.pendingModeration ||
      Object.keys(pharmacy.pendingModeration).length === 0
    ) {
      throw httpError(
        HTTP_STATUS.BAD_REQUEST,
        'There are no pharmacy changes to send for moderation.'
      );
    }

    pharmacy.status = PHARMACY_STATUSES.ON_MODERATION;
  }

  pharmacy.updatedBy = new Types.ObjectId(userId);
  await pharmacy.save();

  return {
    pharmacy: serializePharmacyProfile(pharmacy),
    message:
      pharmacy.status === PHARMACY_STATUSES.ON_VERIFICATION
        ? 'Pharmacy was sent for verification.'
        : 'Pharmacy changes were sent for moderation.',
  };
}
