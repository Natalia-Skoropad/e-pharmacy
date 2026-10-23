import { Types } from 'mongoose';

import { USER_ROLES } from '../../../constants/auth';
import { HTTP_STATUS } from '../../../constants/httpStatus';

import { Session } from '../../../models/accounts/session.model';
import { User } from '../../../models/accounts/user.model';

import { httpError } from '../../../utils/httpError';

//===============================================================

export async function listAdminPharmacyOwnerSessionsService(ownerId: string) {
  const userId = new Types.ObjectId(ownerId);
  const exists = await User.exists({ _id: userId, role: USER_ROLES.PHARMACY });

  if (!exists)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');

  const sessions = await Session.find({
    userId,
    roleAtLogin: USER_ROLES.PHARMACY,
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return {
    sessions: sessions.map((session) => ({
      id: String(session._id),

      ...(session.deviceName ? { deviceName: session.deviceName } : {}),
      ...(session.userAgent ? { userAgent: session.userAgent } : {}),
      ...(session.ip ? { ip: session.ip } : {}),

      roleAtLogin: session.roleAtLogin,

      ...(session.createdAt
        ? { createdAt: session.createdAt.toISOString() }
        : {}),

      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),

      ...(session.revokedAt
        ? { revokedAt: session.revokedAt.toISOString() }
        : {}),

      ...(session.revokedReason
        ? { revokedReason: session.revokedReason }
        : {}),

      isCurrent: false,
    })),
  };
}
