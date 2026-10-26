import { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../../../constants/admin/audit/admin-audit';

import { USER_ROLES, PHARMACY_STATUSES } from '../../../constants/auth/auth';
import { HTTP_STATUS } from '../../../constants/http/httpStatus';

import { AdminAuditLog } from '../../../models/audit/adminAuditLog.model';
import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { PharmacyOwnerAdminComment } from '../../../models/admin/comments/pharmacyOwnerAdminComment.model';
import { PharmacyOwnerDocument } from '../../../models/owners/pharmacyOwnerDocument.model';
import { User } from '../../../models/accounts/user.model';

import { httpError } from '../../../utils/http/httpError';

//===============================================================

type OwnerDetailAggregateRow = Readonly<{
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  pictureUrl: string | null;
  status: 'new' | 'active' | 'blocked';
  statusReason: string | null;
  registeredAt: Date;
  lastPersonalDataUpdateAt: Date;

  pharmacyStatistics: Readonly<{
    all: number;
    new: number;
    onVerification: number;
    onModeration: number;
    active: number;
    blocked: number;
  }>;

  tabCounts: Readonly<{
    pharmacies: number;
    documents: number;
    comments: number;
  }>;
}>;

//===============================================================

export async function getAdminPharmacyOwnerDetailService(ownerId: string) {
  const ownerObjectId = new Types.ObjectId(ownerId);

  const [owner] = await User.aggregate<OwnerDetailAggregateRow>([
    {
      $match: {
        _id: ownerObjectId,
        role: USER_ROLES.PHARMACY,
      },
    },
    {
      $lookup: {
        from: Pharmacy.collection.name,
        let: { ownerId: '$_id' },

        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$ownerId', '$$ownerId'] },
            },
          },
          {
            $group: {
              _id: null,
              all: { $sum: 1 },

              new: {
                $sum: {
                  $cond: [{ $eq: ['$status', PHARMACY_STATUSES.NEW] }, 1, 0],
                },
              },

              onVerification: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', PHARMACY_STATUSES.ON_VERIFICATION] },
                    1,
                    0,
                  ],
                },
              },

              onModeration: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', PHARMACY_STATUSES.ON_MODERATION] },
                    1,
                    0,
                  ],
                },
              },

              active: {
                $sum: {
                  $cond: [{ $eq: ['$status', PHARMACY_STATUSES.ACTIVE] }, 1, 0],
                },
              },

              blocked: {
                $sum: {
                  $cond: [
                    { $eq: ['$status', PHARMACY_STATUSES.BLOCKED] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $project: { _id: 0 } },
        ],

        as: 'pharmacyStatistics',
      },
    },
    {
      $set: {
        pharmacyStatistics: {
          $ifNull: [
            { $arrayElemAt: ['$pharmacyStatistics', 0] },
            {
              all: 0,
              new: 0,
              onVerification: 0,
              onModeration: 0,
              active: 0,
              blocked: 0,
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: AdminAuditLog.collection.name,
        let: { ownerId: { $toString: '$_id' } },

        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [
                      '$scopeEntityType',
                      ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
                    ],
                  },
                  { $eq: ['$scopeEntityId', '$$ownerId'] },
                  {
                    $in: [
                      '$action',
                      [
                        ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_ACCOUNT_CREATED,
                        ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PROFILE_UPDATED,
                        ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_PHOTO_UPDATED,
                      ],
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { createdAt: -1, _id: -1 } },
          { $limit: 1 },
          { $project: { _id: 0, createdAt: 1 } },
        ],

        as: 'lastPersonalDataUpdate',
      },
    },
    {
      $lookup: {
        from: PharmacyOwnerDocument.collection.name,
        let: { ownerId: '$_id' },

        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$ownerUserId', '$$ownerId'] },
            },
          },
          { $count: 'count' },
        ],

        as: 'documentCount',
      },
    },
    {
      $lookup: {
        from: PharmacyOwnerAdminComment.collection.name,
        let: { ownerId: '$_id' },

        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$ownerUserId', '$$ownerId'] },
            },
          },
          { $count: 'count' },
        ],

        as: 'commentCount',
      },
    },
    {
      $set: {
        tabCounts: {
          pharmacies: '$pharmacyStatistics.all',

          documents: {
            $ifNull: [{ $arrayElemAt: ['$documentCount.count', 0] }, 0],
          },

          comments: {
            $ifNull: [{ $arrayElemAt: ['$commentCount.count', 0] }, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        email: 1,
        phone: 1,
        address: { $ifNull: ['$address', null] },
        pictureUrl: { $ifNull: ['$pictureUrl', null] },
        status: 1,
        statusReason: { $ifNull: ['$statusReason', null] },
        registeredAt: '$createdAt',

        lastPersonalDataUpdateAt: {
          $ifNull: [
            { $arrayElemAt: ['$lastPersonalDataUpdate.createdAt', 0] },
            '$createdAt',
          ],
        },

        pharmacyStatistics: 1,
        tabCounts: 1,
      },
    },
  ]);

  if (!owner) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }

  return {
    id: owner.id,
    name: owner.name,
    email: owner.email,
    phone: owner.phone,

    ...(owner.address ? { address: owner.address } : {}),
    ...(owner.pictureUrl ? { pictureUrl: owner.pictureUrl } : {}),

    status: owner.status,

    ...(owner.statusReason ? { statusReason: owner.statusReason } : {}),

    registeredAt: owner.registeredAt.toISOString(),
    lastPersonalDataUpdateAt: owner.lastPersonalDataUpdateAt.toISOString(),
    pharmacyStatistics: owner.pharmacyStatistics,
    tabCounts: owner.tabCounts,
  };
}
