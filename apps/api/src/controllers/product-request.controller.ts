import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { productRequestsQuerySchema } from '../schemas/product-request.schema';
import { getProductRequestsService } from '../services/product-request.service';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function getProductRequests(
  req: Request,
  res: Response
): Promise<void> {
  const query = productRequestsQuerySchema.parse(req.query);
  const data = await getProductRequestsService(req.user?.id ?? '', query);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data,
  });
}
