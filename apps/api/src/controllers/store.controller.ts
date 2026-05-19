import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createStoreReviewSchema,
  storesQuerySchema,
} from '../schemas/store.schema';
import {
  createStoreReviewService,
  getStoreDetailsService,
  getStoreFiltersService,
  getStoreReviewsService,
  getStoresService,
  toggleFavoriteStoreService,
} from '../services/store.service';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type StoreParams = {
  storeId: string;
};

//===============================================================

export async function getStores(req: Request, res: Response): Promise<void> {
  const query = storesQuerySchema.parse(req.query);
  const data = await getStoresService(query, req.user?.id);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}


//===============================================================

export async function getStoreFilters(
  _req: Request,
  res: Response
): Promise<void> {
  const data = await getStoreFiltersService();

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getStoreDetails(
  req: Request,
  res: Response
): Promise<void> {
  const { storeId } = req.params as StoreParams;

  const data = await getStoreDetailsService(storeId, req.user?.id);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function getStoreReviews(
  req: Request,
  res: Response
): Promise<void> {
  const { storeId } = req.params as StoreParams;

  const data = await getStoreReviewsService(storeId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}

//===============================================================

export async function createStoreReview(
  req: Request,
  res: Response
): Promise<void> {
  const { storeId } = req.params as StoreParams;
  const body = createStoreReviewSchema.parse(req.body);

  const data = await createStoreReviewService(storeId, {
    userId: req.user?.id ?? '',
    userName: req.user?.name ?? 'Customer',
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

export async function toggleFavoriteStore(
  req: Request,
  res: Response
): Promise<void> {
  const { storeId } = req.params as StoreParams;

  const data = await toggleFavoriteStoreService(storeId, req.user?.id ?? '');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}
