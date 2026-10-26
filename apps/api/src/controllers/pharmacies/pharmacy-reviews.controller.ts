import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type {
  CreatePharmacyReviewInput,
  ModeratePharmacyReviewInput,
  PendingPharmacyReviewsQuery,
  PharmacyIdParams,
  PharmacyReviewParams,
} from '../../schemas/pharmacies/pharmacy.schema';

import {
  createPharmacyReviewService,
  getPendingPharmacyReviewsService,
  getPharmacyReviewsService,
  moderatePharmacyReviewService,
} from '../../services/pharmacies/pharmacy-reviews.service';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

export async function getPendingPharmacyReviews(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, PendingPharmacyReviewsQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getPendingPharmacyReviewsService(query);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyReviews(
  _req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;
  const data = await getPharmacyReviewsService(pharmacyId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createPharmacyReview(
  req: Request,
  res: ValidatedResponse<CreatePharmacyReviewInput, PharmacyIdParams>
): Promise<void> {
  const { body, params } = res.locals.validated;

  const data = await createPharmacyReviewService(params.pharmacyId, {
    userId: req.user?.id ?? '',
    userName: req.user?.name ?? 'client',
    rating: body.rating,
    comment: body.comment,
  });

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function moderatePharmacyReview(
  req: Request,
  res: ValidatedResponse<ModeratePharmacyReviewInput, PharmacyReviewParams>
): Promise<void> {
  const { body, params } = res.locals.validated;

  const data = await moderatePharmacyReviewService(
    params.pharmacyId,
    params.reviewId,

    {
      status: body.status,
      reason: body.reason,
      moderatorId: req.user?.id ?? '',
    }
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
