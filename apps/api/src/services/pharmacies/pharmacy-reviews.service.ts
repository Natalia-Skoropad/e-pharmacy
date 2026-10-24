import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { API_MESSAGES } from '../../constants/shared/messages';
import { REVIEW_ERROR_CODES } from '../../constants/reviews/reviews';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyReview } from '../../models/reviews/pharmacyReview.model';

import type {
  PharmacyReviewResponseDto,
  ReviewModerationStatus,
} from '../../types/pharmacy';

import { httpError } from '../../utils/httpError';
import { isDuplicatePharmacyReviewError } from '../../utils/mongoError';
import { PUBLIC_PHARMACY_STATUS_FILTER } from './pharmacy-public-status';

//===============================================================

type PendingReviewsQuery = { page: number; perPage: number };

//===============================================================

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

  try {
    await PharmacyReview.create({
      pharmacyId,
      userId: input.userId,
      userName: input.userName,
      rating: input.rating,
      comment: input.comment,
      status: 'on_moderation',
    });
  } catch (error) {
    if (isDuplicatePharmacyReviewError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'You already have a pending or approved review for this pharmacy.',
        undefined,

        REVIEW_ERROR_CODES.ALREADY_SUBMITTED
      );
    }

    throw error;
  }

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
    page: total === 0 ? 1 : query.page,
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
