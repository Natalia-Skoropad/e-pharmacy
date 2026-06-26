import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  createPharmacyReviewSchema,
  moderatePharmacyReviewSchema,
  sendMyPharmacyForVerificationSchema,
  updateMyPharmacyProfileSchema,
  pendingPharmacyReviewsQuerySchema,
  pharmaciesQuerySchema,
} from '../schemas/pharmacy.schema';

import {
  createPharmacyReviewService,
  getFavoritePharmacyIdsService,
  getFavoritePharmaciesService,
  getPharmacyCheckoutDetailsService,
  getPharmacyDetailsService,
  getPharmacyFiltersService,
  getMyPharmacyProfileService,
  getPharmacyOptionsService,
  getPendingPharmacyReviewsService,
  getPharmacyReviewsService,
  getPharmaciesService,
  moderatePharmacyReviewService,
  sendMyPharmacyForVerificationService,
  setFavoritePharmacyService,
  updateMyPharmacyProfileService,
} from '../services/pharmacy.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type PharmacyParams = {
  pharmacyId: string;
};

//===============================================================

export async function getMyPharmacyProfile(
  req: Request,
  res: Response
): Promise<void> {
  const data = await getMyPharmacyProfileService(req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function updateMyPharmacyProfile(
  req: Request,
  res: Response
): Promise<void> {
  const body = updateMyPharmacyProfileSchema.parse(req.body);
  const data = await updateMyPharmacyProfileService(req.user?.id ?? '', body);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function sendMyPharmacyForVerification(
  req: Request,
  res: Response
): Promise<void> {
  sendMyPharmacyForVerificationSchema.parse(req.body ?? {});

  const data = await sendMyPharmacyForVerificationService(req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getPharmacies(req: Request, res: Response): Promise<void> {
  const query = pharmaciesQuerySchema.parse(req.query);
  const data = await getPharmaciesService(query, req.user?.id);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getPharmacyFilters(
  _req: Request,
  res: Response
): Promise<void> {
  const data = await getPharmacyFiltersService();

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getPharmacyOptions(
  _req: Request,
  res: Response
): Promise<void> {
  const data = await getPharmacyOptionsService();

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}


//===============================================================

export async function getFavoritePharmacyIds(
  req: Request,
  res: Response
): Promise<void> {
  const data = await getFavoritePharmacyIdsService(req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getFavoritePharmacies(
  req: Request,
  res: Response
): Promise<void> {
  const query = pharmaciesQuerySchema.parse(req.query);
  const data = await getFavoritePharmaciesService(query, req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getPharmacyDetails(
  req: Request,
  res: Response
): Promise<void> {
  const { pharmacyId } = req.params as PharmacyParams;

  const data = await getPharmacyDetailsService(pharmacyId, req.user?.id);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================


export async function getPharmacyCheckoutDetails(
  req: Request,
  res: Response
): Promise<void> {
  const { pharmacyId } = req.params as PharmacyParams;
  const data = await getPharmacyCheckoutDetailsService(pharmacyId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getPendingPharmacyReviews(
  req: Request,
  res: Response
): Promise<void> {
  const query = pendingPharmacyReviewsQuerySchema.parse(req.query);
  const data = await getPendingPharmacyReviewsService(query);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getPharmacyReviews(
  req: Request,
  res: Response
): Promise<void> {
  const { pharmacyId } = req.params as PharmacyParams;

  const data = await getPharmacyReviewsService(pharmacyId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function createPharmacyReview(
  req: Request,
  res: Response
): Promise<void> {
  const { pharmacyId } = req.params as PharmacyParams;
  const body = createPharmacyReviewSchema.parse(req.body);

  const data = await createPharmacyReviewService(pharmacyId, {
    userId: req.user?.id ?? '',
    userName: req.user?.name ?? 'client',
    rating: body.rating,
    comment: body.comment,
  });

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    data,
  });
}

//===============================================================

export async function moderatePharmacyReview(
  req: Request,
  res: Response
): Promise<void> {
  const { pharmacyId, reviewId } = req.params as PharmacyParams & {
    reviewId: string;
  };
  const body = moderatePharmacyReviewSchema.parse(req.body);

  const data = await moderatePharmacyReviewService(pharmacyId, reviewId, {
    status: body.status,
    reason: body.reason,
    moderatorId: req.user?.id ?? '',
  });

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function setFavoritePharmacy(
  req: Request,
  res: Response
): Promise<void> {
  const { pharmacyId } = req.params as PharmacyParams;

  const data = await setFavoritePharmacyService(
    pharmacyId,
    req.user?.id ?? '',
    req.method === 'PUT'
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}
