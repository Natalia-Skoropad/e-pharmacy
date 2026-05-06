import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { storesQuerySchema } from '../schemas/store.schema';
import {
  getStoreDetailsService,
  getStoresService,
} from '../services/store.service';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type StoreParams = {
  storeId: string;
};

//===============================================================

export async function getStores(req: Request, res: Response): Promise<void> {
  const query = storesQuerySchema.parse(req.query);
  const data = await getStoresService(query);

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

  const data = await getStoreDetailsService(storeId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}
