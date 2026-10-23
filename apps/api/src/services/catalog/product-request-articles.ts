import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/httpStatus';
import { PRODUCT_REQUEST_ERROR_CODES } from '../../constants/product-request';

import { Product } from '../../models/catalog/product.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';

import { httpError } from '../../utils/httpError';

//===============================================================

export async function getArticleConflict(
  article: string,
  excludeRequestId?: string
): Promise<string | null> {
  const normalizedArticle = article.trim().toUpperCase();

  if (!normalizedArticle) return null;

  const requestFilter: Record<string, unknown> = {
    article: normalizedArticle,
    status: { $ne: 'rejected' },
  };

  if (excludeRequestId && Types.ObjectId.isValid(excludeRequestId)) {
    requestFilter._id = { $ne: new Types.ObjectId(excludeRequestId) };
  }

  const [existingProduct, existingRequest] = await Promise.all([
    Product.exists({ article: normalizedArticle }),
    ProductRequest.exists(requestFilter),
  ]);

  if (existingProduct) {
    return 'A product with this article already exists in the global catalog.';
  }

  if (existingRequest) {
    return 'Another active product request already uses this article.';
  }

  return null;
}

//===============================================================

export async function assertArticleAvailable(
  article: string,
  excludeRequestId?: string
): Promise<void> {
  const conflict = await getArticleConflict(article, excludeRequestId);

  if (conflict) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      conflict,
      undefined,

      PRODUCT_REQUEST_ERROR_CODES.ARTICLE_CONFLICT
    );
  }
}
