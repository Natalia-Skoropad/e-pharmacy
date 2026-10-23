import { Types, type ClientSession } from 'mongoose';

import { Product } from '../../../models/product.model';
import { ProductRequest } from '../../../models/productRequest.model';

import type { ProductCategoryUsageDto } from '../../../types/admin-settings';

//===============================================================

type UsageAggregationRow = Readonly<{
  _id: Types.ObjectId;
  count: number;
}>;

//===============================================================

export async function getCategoryUsageMap(
  categoryIds: readonly Types.ObjectId[]
): Promise<Map<string, ProductCategoryUsageDto>> {
  if (categoryIds.length === 0) return new Map();

  const [productRows, requestRows] = await Promise.all([
    Product.aggregate<UsageAggregationRow>([
      { $match: { categoryId: { $in: categoryIds } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]),

    ProductRequest.aggregate<UsageAggregationRow>([
      { $match: { categoryId: { $in: categoryIds } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]),
  ]);

  const productCounts = new Map(
    productRows.map((row) => [String(row._id), row.count])
  );

  const requestCounts = new Map(
    requestRows.map((row) => [String(row._id), row.count])
  );

  return new Map(
    categoryIds.map((categoryId) => {
      const key = String(categoryId);
      const productsCount = productCounts.get(key) ?? 0;
      const productRequestsCount = requestCounts.get(key) ?? 0;

      return [
        key,
        {
          productsCount,
          productRequestsCount,
          total: productsCount + productRequestsCount,
        },
      ];
    })
  );
}

//===============================================================

export async function getCategoryUsageInSession(
  categoryId: Types.ObjectId,
  session: ClientSession
): Promise<ProductCategoryUsageDto> {
  const [productsCount, productRequestsCount] = await Promise.all([
    Product.countDocuments({ categoryId }).session(session),
    ProductRequest.countDocuments({ categoryId }).session(session),
  ]);

  return {
    productsCount,
    productRequestsCount,
    total: productsCount + productRequestsCount,
  };
}
