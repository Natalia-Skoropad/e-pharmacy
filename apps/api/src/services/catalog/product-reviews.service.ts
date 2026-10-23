import { HTTP_STATUS } from '../../constants/httpStatus';
import { REVIEW_ERROR_CODES } from '../../constants/reviews';
import { API_MESSAGES } from '../../constants/messages';

import { Product } from '../../models/catalog/product.model';
import { ProductReview } from '../../models/reviews/productReview.model';

import type {
  ProductReviewResponseDto,
  ReviewModerationStatus,
} from '../../types/product';

import { httpError } from '../../utils/httpError';
import { isDuplicateProductReviewError } from '../../utils/mongoError';

import { getManagedProductDetailsService } from './product-management.service';

import type { ProductManagementActor } from './product-management-access';

//===============================================================

type CreateReviewInput = {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
};

//===============================================================

type PendingReviewsQuery = { page: number; perPage: number };

//===============================================================

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
