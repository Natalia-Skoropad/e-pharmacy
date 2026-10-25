import { type PipelineStage, type Types } from 'mongoose';

import { Order } from '../../models/orders/order.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';

import type { ClientsQuery } from '../../schemas/clients/client.schema';

import { buildClientFilterStages } from './client-registry-filters';

import type {
  PharmacyDocument,
  ClientRow,
  ClientStatistics,
  ClientAggregationResult,
} from './client-types';

//===============================================================

export async function getClientRowsForPharmacy(
  pharmacyId: Types.ObjectId,
  query: ClientsQuery
): Promise<{
  items: ClientRow[];
  total: number;
  statistics: ClientStatistics;
  earliestCreatedAt: string | null;
}> {
  const pharmacy = await Pharmacy.findById(pharmacyId)
    .select('imageUrl activatedAt approvedAt createdAt')

    .lean<Pick<
      PharmacyDocument,
      '_id' | 'imageUrl' | 'activatedAt' | 'approvedAt' | 'createdAt'
    > | null>();

  if (!pharmacy) {
    return {
      items: [],
      total: 0,
      statistics: { total: 0, repeat: 0, active: 0, blocked: 0 },
      earliestCreatedAt: null,
    };
  }

  const fallbackDate =
    pharmacy.activatedAt ?? pharmacy.approvedAt ?? pharmacy.createdAt;

  const filterStages = buildClientFilterStages(query);
  const skip = (query.page - 1) * query.perPage;

  const itemsFacet: PipelineStage.FacetPipelineStage[] = [
    ...filterStages,

    { $sort: { isDefault: -1, firstOrderAt: -1 } },
    { $skip: skip },
    { $limit: query.perPage },
  ];

  const totalFacet: PipelineStage.FacetPipelineStage[] = [
    ...filterStages,

    { $count: 'count' },
  ];

  const statisticsFacet: PipelineStage.FacetPipelineStage[] = [
    {
      $group: {
        _id: null,
        total: { $sum: 1 },

        repeat: {
          $sum: {
            $cond: [{ $gte: ['$successfulOrdersCount', 2] }, 1, 0],
          },
        },

        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },

        blocked: {
          $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] },
        },

        earliestOrderCandidates: { $push: '$earliestOrderAt' },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        repeat: 1,
        active: 1,
        blocked: 1,

        earliestOrderAt: {
          $min: {
            $filter: {
              input: '$earliestOrderCandidates',
              as: 'orderDate',
              cond: { $ne: ['$$orderDate', null] },
            },
          },
        },
      },
    },
  ];

  const pipeline: PipelineStage[] = [
    { $match: { pharmacyId } },

    {
      $set: {
        latestDeliveryAddressCandidate: {
          $cond: [
            {
              $and: [
                { $eq: ['$delivery.method', 'postal_delivery'] },
                {
                  $gt: [
                    {
                      $strLenCP: {
                        $ifNull: ['$delivery.details.address', ''],
                      },
                    },
                    0,
                  ],
                },
              ],
            },
            '$delivery.details.address',
            null,
          ],
        },

        hasDeliveryAddressCandidate: {
          $cond: [
            {
              $and: [
                { $eq: ['$delivery.method', 'postal_delivery'] },
                {
                  $gt: [
                    {
                      $strLenCP: {
                        $ifNull: ['$delivery.details.address', ''],
                      },
                    },
                    0,
                  ],
                },
              ],
            },
            1,
            0,
          ],
        },
      },
    },

    {
      $sort: {
        userId: 1,
        hasDeliveryAddressCandidate: -1,
        createdAt: -1,
      },
    },

    {
      $group: {
        _id: '$userId',
        firstOrderAt: { $min: '$createdAt' },
        earliestOrderAt: { $min: '$createdAt' },

        successfulOrdersCount: {
          $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] },
        },

        successfulOrdersAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'successful'] }, '$totalPrice', 0],
          },
        },

        latestDeliveryAddress: { $first: '$latestDeliveryAddressCandidate' },
      },
    },

    {
      $lookup: {
        from: User.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },

    { $unwind: '$user' },
    { $set: { sourcePriority: 1 } },

    {
      $unionWith: {
        coll: User.collection.name,
        pipeline: [
          {
            $match: {
              isDefaultPharmacyClient: true,
              defaultClientPharmacyId: pharmacyId,
            },
          },

          {
            $project: {
              _id: 1,
              firstOrderAt: { $literal: null },
              earliestOrderAt: { $literal: null },
              successfulOrdersCount: { $literal: 0 },
              successfulOrdersAmount: { $literal: 0 },
              latestDeliveryAddress: { $literal: null },
              sourcePriority: { $literal: 0 },

              user: {
                _id: '$_id',
                name: '$name',
                email: '$email',
                phone: '$phone',
                address: '$address',
                pictureUrl: '$pictureUrl',
                status: '$status',
                statusReason: '$statusReason',
                isDefaultPharmacyClient: '$isDefaultPharmacyClient',
              },
            },
          },
        ],
      },
    },

    { $sort: { _id: 1, sourcePriority: -1 } },

    {
      $group: {
        _id: '$_id',
        row: { $first: '$$ROOT' },
      },
    },

    { $replaceRoot: { newRoot: '$row' } },

    {
      $set: {
        isDefault: { $eq: ['$user.isDefaultPharmacyClient', true] },
      },
    },

    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },

        photoUrl: {
          $cond: [
            '$isDefault',
            pharmacy.imageUrl ?? null,
            { $ifNull: ['$user.pictureUrl', null] },
          ],
        },

        firstOrderAt: {
          $cond: ['$isDefault', fallbackDate, '$firstOrderAt'],
        },

        earliestOrderAt: 1,
        name: { $cond: ['$isDefault', 'Walk-in client', '$user.name'] },
        email: { $cond: ['$isDefault', '', '$user.email'] },
        phone: { $cond: ['$isDefault', '', '$user.phone'] },

        address: {
          $cond: [
            '$isDefault',
            '',
            {
              $cond: [
                { $gt: [{ $strLenCP: { $ifNull: ['$user.address', ''] } }, 0] },
                '$user.address',
                { $ifNull: ['$latestDeliveryAddress', 'Not specified'] },
              ],
            },
          ],
        },

        successfulOrdersCount: 1,
        successfulOrdersAmount: 1,

        status: {
          $cond: [
            '$isDefault',
            'active',
            {
              $cond: [
                { $eq: ['$user.status', 'blocked'] },
                'blocked',
                'active',
              ],
            },
          ],
        },

        statusReason: {
          $cond: [
            '$isDefault',
            null,
            { $ifNull: ['$user.statusReason', null] },
          ],
        },

        isDefault: 1,
      },
    },

    {
      $facet: {
        items: itemsFacet,
        total: totalFacet,
        statistics: statisticsFacet,
      },
    },
  ];

  const [result] = await Order.aggregate<ClientAggregationResult>(pipeline);
  const total = result?.total[0]?.count ?? 0;

  const statistics = result?.statistics[0] ?? {
    total: 0,
    repeat: 0,
    active: 0,
    blocked: 0,
    earliestOrderAt: null,
  };

  return {
    items: (result?.items ?? []).map((client) => ({
      id: client.id,
      photoUrl: client.photoUrl,
      firstOrderAt: client.firstOrderAt.toISOString(),

      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,

      successfulOrdersCount: client.successfulOrdersCount,
      successfulOrdersAmount: client.successfulOrdersAmount,
      status: client.status,

      ...(client.statusReason ? { statusReason: client.statusReason } : {}),

      isDefault: client.isDefault,
    })),

    total,

    statistics: {
      total: statistics.total,
      repeat: statistics.repeat,
      active: statistics.active,
      blocked: statistics.blocked,
    },

    earliestCreatedAt: statistics.earliestOrderAt
      ? statistics.earliestOrderAt.toISOString().slice(0, 10)
      : null,
  };
}
