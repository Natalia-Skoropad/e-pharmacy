import type { PipelineStage } from 'mongoose';

import { USER_STATUSES } from '../../../constants/auth';
import { Order } from '../../../models/orders/order.model';
import { ProductOffer } from '../../../models/inventory/productOffer.model';
import { User } from '../../../models/accounts/user.model';

//===============================================================

// Shared KPI projection for filtered pharmacy lists across Admin, Owner and
// Manager contexts. Callers are responsible for role/tenant scope BEFORE
// their $facet; this function paginates BEFORE expensive metric lookups.

export function buildPagedPharmacyItemsPipeline(
  skip: number,
  perPage: number,
  includeOwnerId = false
): PipelineStage.FacetPipelineStage[] {
  return [
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: perPage },
    {
      $lookup: {
        from: ProductOffer.collection.name,
        let: { pharmacyId: '$_id' },

        pipeline: [
          { $match: { $expr: { $eq: ['$pharmacyId', '$$pharmacyId'] } } },
          { $count: 'count' },
        ],

        as: '_productCount',
      },
    },
    {
      $lookup: {
        from: Order.collection.name,
        let: { pharmacyId: '$_id' },

        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$pharmacyId', '$$pharmacyId'] },
            },
          },
          // The parent pharmacy list already uses $facet for items and total.
          // MongoDB forbids a second $facet nested through this $lookup, so
          // calculate order metrics and unique clients in one $group instead.
          {
            $group: {
              _id: null,
              successfulOrdersCount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'successful'] }, 1, 0],
                },
              },

              successfulRevenue: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'successful'] }, '$totalPrice', 0],
                },
              },

              orderClientIds: { $addToSet: '$userId' },
            },
          },
          {
            $lookup: {
              from: User.collection.name,
              localField: 'orderClientIds',
              foreignField: '_id',

              pipeline: [
                {
                  $match: {
                    $or: [
                      { isDefaultPharmacyClient: true },
                      { status: { $ne: USER_STATUSES.BLOCKED } },
                    ],
                  },
                },
                { $count: 'count' },
              ],

              as: 'activeOrderClients',
            },
          },
          {
            $project: {
              _id: 0,
              successfulOrdersCount: 1,
              successfulRevenue: 1,

              activeOrderClientsCount: {
                $ifNull: [
                  { $arrayElemAt: ['$activeOrderClients.count', 0] },
                  0,
                ],
              },

              orderClientIds: 1,
            },
          },
        ],
        as: 'orderStatistics',
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        let: { pharmacyId: '$_id' },

        pipeline: [
          {
            $match: {
              isDefaultPharmacyClient: true,
              $expr: {
                $eq: ['$defaultClientPharmacyId', '$$pharmacyId'],
              },
            },
          },
          { $project: { _id: 1 } },
          { $limit: 1 },
        ],

        as: 'defaultClients',
      },
    },
    {
      $set: {
        orderStatistics: { $arrayElemAt: ['$orderStatistics', 0] },
        defaultClient: { $arrayElemAt: ['$defaultClients', 0] },
      },
    },
    {
      $set: {
        activeClientsCount: {
          $add: [
            { $ifNull: ['$orderStatistics.activeOrderClientsCount', 0] },
            {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [{ $ifNull: ['$defaultClient._id', null] }, null],
                    },
                    {
                      $not: [
                        {
                          $in: [
                            '$defaultClient._id',
                            {
                              $ifNull: ['$orderStatistics.orderClientIds', []],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        email: { $ifNull: ['$email', null] },
        phone: { $ifNull: ['$phone', null] },
        location: { $ifNull: ['$location', null] },
        imageUrl: { $ifNull: ['$imageUrl', null] },
        createdAt: 1,
        status: 1,

        ...(includeOwnerId ? { ownerId: 1 } : {}),

        activeClientsCount: 1,

        addedProductsCount: {
          $ifNull: [{ $arrayElemAt: ['$_productCount.count', 0] }, 0],
        },

        successfulOrdersCount: {
          $ifNull: ['$orderStatistics.successfulOrdersCount', 0],
        },

        successfulRevenue: {
          $ifNull: ['$orderStatistics.successfulRevenue', 0],
        },

        rating: { $ifNull: ['$rating', 0] },
        reviewsCount: { $ifNull: ['$reviewsCount', 0] },
      },
    },
  ];
}
