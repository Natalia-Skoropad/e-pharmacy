import { type PipelineStage, type Types } from 'mongoose';

import { Product } from '../../models/catalog/product.model';

import type { ClientProductsQuery } from '../../schemas/clients/client.schema';
import { createSafeRegExp } from '../../utils/validation/regexp';

//===============================================================

function buildClientProductFilterStages(
  query: ClientProductsQuery
): PipelineStage.FacetPipelineStage[] {
  const match: Record<string, unknown> = {};

  if (query.productId) {
    match.id = query.productId;
  }

  if (query.keyword?.trim()) {
    const keyword = createSafeRegExp(query.keyword.trim());
    match.$or = [{ id: keyword }, { name: keyword }, { article: keyword }];
  }

  if (query.article?.trim()) {
    match.article = createSafeRegExp(query.article.trim());
  }

  if (query.name?.trim()) {
    match.name = createSafeRegExp(query.name.trim());
  }

  if (query.category) {
    match.categorySlug = query.category;
  }

  if (query.status) {
    match.currentStatus = query.status;
  }

  if (query.dateFrom || query.dateTo) {
    // Calendar dates in the table use Europe/Kyiv. Compare that same day key
    // rather than UTC midnight, which can exclude orders near local midnight.
    match.firstOrderCalendarDate = {
      ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
      ...(query.dateTo ? { $lte: query.dateTo } : {}),
    };
  }

  return Object.keys(match).length ? [{ $match: match }] : [];
}

//===============================================================

export function buildClientProductsAggregationPipeline(
  pharmacyIds: Types.ObjectId | Types.ObjectId[],
  clientObjectId: Types.ObjectId,
  query: ClientProductsQuery,
  skip: number
): PipelineStage[] {
  const filterStages = buildClientProductFilterStages(query);

  const itemsFacet: PipelineStage.FacetPipelineStage[] = [
    ...filterStages,

    { $sort: { firstOrderDate: -1, productId: 1 } },
    { $skip: skip },
    { $limit: query.perPage },
    { $unset: 'firstOrderCalendarDate' },
  ];

  const totalFacet: PipelineStage.FacetPipelineStage[] = [
    ...filterStages,
    { $count: 'count' },
  ];

  const metadataFacet: PipelineStage.FacetPipelineStage[] = [
    {
      $group: {
        _id: null,
        earliestCreatedAt: { $min: '$firstOrderDate' },
        availableFirstOrderDates: { $addToSet: '$firstOrderCalendarDate' },
      },
    },
    { $project: { _id: 0, earliestCreatedAt: 1, availableFirstOrderDates: 1 } },
  ];

  return [
    {
      $match: {
        pharmacyId: Array.isArray(pharmacyIds)
          ? { $in: pharmacyIds }
          : pharmacyIds,

        userId: clientObjectId,
        status: 'successful',
      },
    },
    {
      $unwind: {
        path: '$items',
        includeArrayIndex: 'itemIndex',
      },
    },
    {
      $sort: {
        'items.productId': 1,
        createdAt: 1,
        _id: 1,
        itemIndex: 1,
      },
    },
    {
      $group: {
        _id: '$items.productId',
        firstOrderDate: { $min: '$createdAt' },

        photoUrl: {
          $first: { $ifNull: ['$items.productSnapshot.imageUrl', null] },
        },

        article: { $first: '$items.productSnapshot.article' },
        name: { $first: '$items.productSnapshot.name' },

        categoryId: {
          $first: {
            $cond: [
              { $ne: ['$items.productSnapshot.categoryId', null] },
              { $toString: '$items.productSnapshot.categoryId' },
              null,
            ],
          },
        },

        categoryName: {
          $first: {
            $ifNull: ['$items.productSnapshot.categoryNameSnapshot', null],
          },
        },

        categorySlug: {
          $first: {
            $ifNull: ['$items.productSnapshot.categorySlugSnapshot', null],
          },
        },

        quantity: { $sum: '$items.quantity' },
        totalAmount: { $sum: '$items.totalPrice' },
        orderIds: { $addToSet: '$_id' },
      },
    },
    {
      $lookup: {
        from: Product.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'currentProducts',
        pipeline: [{ $project: { _id: 1, status: 1 } }],
      },
    },
    {
      $set: {
        currentProduct: { $arrayElemAt: ['$currentProducts', 0] },
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        firstOrderDate: 1,
        productId: { $toString: '$_id' },
        photoUrl: 1,
        article: 1,
        name: 1,
        categoryId: 1,
        categoryName: 1,
        categorySlug: 1,
        quantity: 1,
        totalAmount: 1,
        ordersCount: { $size: '$orderIds' },

        currentProductExists: {
          $ne: [{ $ifNull: ['$currentProduct._id', null] }, null],
        },

        currentStatus: { $ifNull: ['$currentProduct.status', null] },

        firstOrderCalendarDate: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$firstOrderDate',
            timezone: 'Europe/Kyiv',
          },
        },
      },
    },
    {
      $facet: {
        items: itemsFacet,
        total: totalFacet,
        metadata: metadataFacet,
      },
    },
  ];
}
