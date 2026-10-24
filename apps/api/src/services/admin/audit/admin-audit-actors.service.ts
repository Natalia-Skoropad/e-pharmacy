import { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ACTOR_TYPES,
  ADMIN_AUDIT_ENTITY_TYPES,
  type AdminAuditActorType,
} from '../../../constants/admin/audit/admin-audit';

import { USER_ROLES } from '../../../constants/auth/auth';

import { AdminAuditLog } from '../../../models/audit/adminAuditLog.model';
import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { User } from '../../../models/accounts/user.model';

import type {
  AdminAuditActorDto,
  AdminAuditActorsResponseDto,
} from '../../../types/admin-audit';

import { buildPharmacyAuditScopeFilter } from './admin-audit-filters';

//===============================================================

export async function listAdminAuditActorsService(
  exactScope?: Readonly<{ pharmacyId: string }>
): Promise<AdminAuditActorsResponseDto> {
  const actors = await AdminAuditLog.aggregate<{
    _id: Types.ObjectId;
    actorType: AdminAuditActorType;

    user: {
      _id: Types.ObjectId;
      name: string;
      email: string;
      phone: string;
      pictureUrl?: string;
      role: 'admin' | 'pharmacy';
      status: 'new' | 'active' | 'blocked';
    };
  }>([
    ...(exactScope
      ? [{ $match: buildPharmacyAuditScopeFilter(exactScope.pharmacyId) }]
      : []),
    {
      $group: {
        _id: '$actorUserId',
        auditedActions: { $addToSet: '$action' },
        auditedEntities: { $addToSet: '$entityType' },
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'users',
      },
    },
    { $unwind: '$users' },
    {
      $lookup: {
        from: Pharmacy.collection.name,
        localField: '_id',
        foreignField: 'ownerId',
        as: 'ownedPharmacies',
      },
    },
    {
      $lookup: {
        from: Pharmacy.collection.name,
        localField: '_id',
        foreignField: 'managerUserIds',
        as: 'managedPharmacies',
      },
    },
    // A pharmacy owner may have audit entries before the first pharmacy is linked
    // (registration documents, for example). Do not hide this actor from history.
    {
      $match: {
        'users.role': { $in: [USER_ROLES.ADMIN, USER_ROLES.PHARMACY] },
      },
    },
    {
      $project: {
        _id: 1,

        user: {
          _id: '$users._id',
          name: '$users.name',
          email: '$users.email',
          phone: '$users.phone',
          pictureUrl: '$users.pictureUrl',
          role: '$users.role',
          status: '$users.status',
        },

        actorType: {
          $cond: [
            { $eq: ['$users.role', USER_ROLES.ADMIN] },

            ADMIN_AUDIT_ACTOR_TYPES.EMPLOYEE,

            {
              $cond: [
                {
                  $or: [
                    { $gt: [{ $size: '$ownedPharmacies' }, 0] },
                    {
                      $in: [
                        ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
                        '$auditedEntities',
                      ],
                    },
                    {
                      $in: [
                        ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER_DOCUMENT,
                        '$auditedEntities',
                      ],
                    },
                    {
                      $in: [
                        'pharmacy.registrationDocuments.attached',
                        '$auditedActions',
                      ],
                    },
                    {
                      $in: [
                        'pharmacyOwner.registrationDocuments.attached',
                        '$auditedActions',
                      ],
                    },
                  ],
                },

                ADMIN_AUDIT_ACTOR_TYPES.PHARMACY_OWNER,
                ADMIN_AUDIT_ACTOR_TYPES.PHARMACY_EMPLOYEE,
              ],
            },
          ],
        },
      },
    },
    { $sort: { 'user.name': 1, _id: 1 } },
  ]);

  const items: AdminAuditActorDto[] = actors.map(({ user, actorType }) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,

    ...(user.pictureUrl ? { pictureUrl: user.pictureUrl } : {}),

    role: user.role,
    actorType,
    status: user.status,
  }));

  return { items };
}

//===============================================================

export async function getAuditActorIdsByType(
  actorType: AdminAuditActorType
): Promise<Types.ObjectId[]> {
  if (actorType === ADMIN_AUDIT_ACTOR_TYPES.EMPLOYEE) {
    return User.find({ role: USER_ROLES.ADMIN }).distinct('_id');
  }

  // Owners can perform audited actions before their first pharmacy is created.
  // Keep the Changed by filter consistent with the actors returned to the UI.
  const [pharmacyOwnerIds, auditedOwnerIds] = await Promise.all([
    Pharmacy.distinct('ownerId'),

    AdminAuditLog.distinct('actorUserId', {
      $or: [
        {
          entityType: {
            $in: [
              ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
              ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER_DOCUMENT,
            ],
          },
        },
        {
          action: {
            $in: [
              'pharmacy.registrationDocuments.attached',
              'pharmacyOwner.registrationDocuments.attached',
            ],
          },
        },
      ],
    }),
  ]);

  const ownerIds = [
    ...new Map(
      [...pharmacyOwnerIds, ...auditedOwnerIds]
        .filter(Boolean)
        .map((id) => [String(id), id] as const)
    ).values(),
  ];

  if (actorType === ADMIN_AUDIT_ACTOR_TYPES.PHARMACY_EMPLOYEE) {
    const managerUserIds = await Pharmacy.distinct('managerUserIds');

    return User.find({
      role: USER_ROLES.PHARMACY,
      _id: { $in: managerUserIds, $nin: ownerIds },
    }).distinct('_id');
  }

  return User.find({
    role: USER_ROLES.PHARMACY,
    _id: { $in: ownerIds },
  }).distinct('_id');
}
