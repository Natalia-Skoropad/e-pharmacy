import mongoose, { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../../constants/admin/audit/admin-audit';

import { HTTP_STATUS } from '../../../constants/http/httpStatus';
import { normalizeSettingsDictionaryNameKey } from '../../../constants/admin/settings/settings-dictionary';
import { Position } from '../../../models/settings/position.model';

import type {
  CreateAdminSettingsDictionaryItemInput,
  UpdateAdminSettingsDictionaryItemInput,
} from '../../../schemas/admin/settings/admin-settings.schema';

import type { AdminPositionDto } from '../../../types/admin/settings/admin-settings';

import { httpError } from '../../../utils/httpError';
import { isMongoDuplicateKeyError } from '../../../utils/mongoError';
import { appendAdminAuditLog } from '../audit/admin-audit-write.service';

import {
  serializePosition,
  zeroPositionUsage,
  type LeanPosition,
} from './admin-settings-position-projection';

//===============================================================

function throwPositionDuplicate(error: unknown): never {
  if (isMongoDuplicateKeyError(error)) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'A position with this name already exists.'
    );
  }

  throw error;
}

//===============================================================

export async function createAdminPositionService(
  input: CreateAdminSettingsDictionaryItemInput,
  adminUserId: string,
  auditRequestId: string
): Promise<AdminPositionDto> {
  const session = await mongoose.startSession();

  let result: AdminPositionDto | null = null;

  try {
    await session.withTransaction(async () => {
      const [position] = await Position.create(
        [
          {
            name: input.name,
            normalizedName: normalizeSettingsDictionaryNameKey(input.name),
            createdBy: adminUserId,
            updatedBy: adminUserId,
          },
        ],
        { session }
      );

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.POSITION_CREATED,
        section: ADMIN_AUDIT_SECTIONS.POSITIONS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.POSITION,
        entityId: String(position._id),
        entityLabel: position.name,
        before: { exists: false },
        after: { exists: true, name: position.name },
        changedFields: ['exists', 'name'],
        requestId: auditRequestId,
        session,
      });

      result = serializePosition(position.toObject() as LeanPosition);
    });
  } catch (error) {
    throwPositionDuplicate(error);
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Position creation transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function updateAdminPositionService(
  positionId: string,
  input: UpdateAdminSettingsDictionaryItemInput,
  adminUserId: string,
  auditRequestId: string
): Promise<AdminPositionDto> {
  const session = await mongoose.startSession();

  let result: AdminPositionDto | null = null;

  try {
    await session.withTransaction(async () => {
      const position = await Position.findById(positionId).session(session);

      if (!position) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Position was not found.');
      }

      const usage = zeroPositionUsage();

      if (usage.total > 0) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This position is already in use and cannot be edited.'
        );
      }

      const nextName = input.name.trim();

      if (position.name === nextName) {
        result = serializePosition(position.toObject() as LeanPosition);
        return;
      }

      const previousName = position.name;

      position.name = input.name;
      position.updatedBy = new Types.ObjectId(adminUserId);

      await position.save({ session });

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.POSITION_UPDATED,
        section: ADMIN_AUDIT_SECTIONS.POSITIONS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.POSITION,
        entityId: String(position._id),
        entityLabel: position.name,
        before: { name: previousName },
        after: { name: position.name },
        changedFields: ['name'],
        requestId: auditRequestId,
        session,
      });

      result = serializePosition(position.toObject() as LeanPosition);
    });
  } catch (error) {
    throwPositionDuplicate(error);
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Position update transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function deleteAdminPositionService(
  positionId: string,
  adminUserId: string,
  auditRequestId: string
): Promise<void> {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const position = await Position.findById(positionId).session(session);

      if (!position) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Position was not found.');
      }

      const usage = zeroPositionUsage();

      if (usage.total > 0) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This position is already in use and cannot be deleted.'
        );
      }

      await Position.deleteOne({ _id: position._id }).session(session);

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.POSITION_DELETED,
        section: ADMIN_AUDIT_SECTIONS.POSITIONS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.POSITION,
        entityId: String(position._id),
        entityLabel: position.name,
        before: { exists: true, name: position.name },
        after: { exists: false },
        changedFields: ['exists', 'name'],
        requestId: auditRequestId,
        session,
      });
    });
  } finally {
    await session.endSession();
  }
}
