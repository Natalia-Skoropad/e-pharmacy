import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import { getPublicProductCategoriesService } from '../services/product-category.service';
import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function getPublicProductCategories(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getPublicProductCategoriesService();

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
