import mongoose from 'mongoose';

import {
  ADMIN_ACCESS_ERROR_CODES,
  ADMIN_ACCESS_STATUSES,
} from '../constants/admin-access';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
} from '../constants/admin-audit';

import { HTTP_STATUS } from '../constants/httpStatus';
import { AdminAccess } from '../models/adminAccess.model';
import { AdminAuthorizationState } from '../models/adminAuthorizationState.model';
import { User } from '../models/user.model';
import { httpError } from '../utils/httpError';
import { appendAdminAuditLog } from './admin-audit.service';
import { getAdminAuthorizationService } from './admin-access.service';

//===============================================================

/**
 * Internal Stage 8 owner lifecycle primitive.
 *
 * There is intentionally no public CRUD route yet. Every future owner mutation
 * must go through this transaction so all owner changes contend on one lock
 * document and cannot concurrently remove the final active Platform Owner.
 */
export async function setPlatformOwnerStatusService(
  actorUserId: string,
  targetUserId: string,
  isPlatformOwner: boolean,
  auditRequestId?: string
): Promise<void> {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await AdminAuthorizationState.findOneAndUpdate(
        { key: 'platform-owner' },
        {
          $setOnInsert: { key: 'platform-owner' },
          $inc: { ownerRevision: 1 },
        },
        { upsert: true, new: true, session, setDefaultsOnInsert: false }
      );

      const actor = await getAdminAuthorizationService(actorUserId, session);

      if (!actor.isPlatformOwner) {
        throw httpError(
          HTTP_STATUS.FORBIDDEN,
          'Platform Owner access is required.',
          undefined,
          ADMIN_ACCESS_ERROR_CODES.PLATFORM_OWNER_REQUIRED
        );
      }

      const target = await getAdminAuthorizationService(targetUserId, session);

      if (target.isPlatformOwner === isPlatformOwner) return;

      if (!isPlatformOwner) {
        const activeOwnerCount = await AdminAccess.countDocuments({
          status: ADMIN_ACCESS_STATUSES.ACTIVE,
          isPlatformOwner: true,
        }).session(session);

        if (activeOwnerCount <= 1) {
          throw httpError(
            HTTP_STATUS.CONFLICT,
            'The last active Platform Owner cannot lose owner access.',
            undefined,
            ADMIN_ACCESS_ERROR_CODES.LAST_PLATFORM_OWNER
          );
        }
      }

      await AdminAccess.updateOne(
        { userId: targetUserId, status: ADMIN_ACCESS_STATUSES.ACTIVE },
        { $set: { isPlatformOwner } },
        { session }
      );

      if (auditRequestId) {
        const targetUser = await User.findById(targetUserId)
          .select('_id name')
          .session(session)
          .lean<{ _id: mongoose.Types.ObjectId; name: string } | null>();

        if (!targetUser) {
          throw new Error('Platform Owner audit target could not be resolved.');
        }

        await appendAdminAuditLog({
          actorUserId,
          action: isPlatformOwner
            ? ADMIN_AUDIT_ACTIONS.PLATFORM_OWNER_GRANTED
            : ADMIN_AUDIT_ACTIONS.PLATFORM_OWNER_REVOKED,
          entityType: ADMIN_AUDIT_ENTITY_TYPES.ADMIN_ACCESS,
          entityId: targetUserId,
          entityLabel: targetUser.name,
          before: { isPlatformOwner: target.isPlatformOwner },
          after: { isPlatformOwner },
          changedFields: ['isPlatformOwner'],
          requestId: auditRequestId,
          session,
        });
      }
    });
  } finally {
    await session.endSession();
  }
}
