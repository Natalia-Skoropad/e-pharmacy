// S10.4: Canonical Auth register domain.
import mongoose from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../constants/admin/audit/admin-audit';

import { AUTH_ERROR_CODES, USER_ROLES } from '../../constants/auth/auth';
import { API_MESSAGES } from '../../constants/shared/messages';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { Client } from '../../models/clients/client.model';
import { User } from '../../models/accounts/user.model';

import type { AuthSessionResult, RegisterInput } from '../../types/auth';
import type { SessionContext } from '../../types/session';

import { httpError } from '../../utils/httpError';

import {
  isDuplicateEmailError,
  isDuplicatePhoneError,
} from '../../utils/mongoError';

import { hashPassword } from '../../utils/password';
import { logger } from '../../utils/logger';
import { getInitialAccountStatusForRole } from '../../utils/account-status';

import { appendAdminAuditLog } from '../admin/audit/admin-audit-write.service';
import { claimRegistrationOwnerDocuments } from '../pharmacies/pharmacy-document.service';

import {
  normalizePhoneForLookup,
  ensurePhoneIsAvailable,
} from './auth-user-fields';

import type { UserDocument } from './auth-user-fields';
import { buildAuthSessionResult } from './auth-sessions.service';

//===============================================================

export async function registerUserService(
  input: RegisterInput,
  context?: SessionContext,
  auditRequestId?: string
): Promise<AuthSessionResult> {
  const phone = normalizePhoneForLookup(input.phone);
  const existingUserWithEmail = await User.exists({ email: input.email });

  if (existingUserWithEmail) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      API_MESSAGES.EMAIL_IN_USE,
      undefined,

      AUTH_ERROR_CODES.EMAIL_CONFLICT
    );
  }

  await ensurePhoneIsAvailable(phone);

  const hashedPassword = await hashPassword(input.password);
  const mongoSession = await mongoose.startSession();

  let user: UserDocument | null = null;

  try {
    user =
      (await mongoSession.withTransaction(async () => {
        const role = input.role || USER_ROLES.CLIENT;

        const [createdUser] = await User.create(
          [
            {
              name: input.name,
              email: input.email,
              password: hashedPassword,
              role,
              status: getInitialAccountStatusForRole(role),
              phone,
              address: input.address,
            },
          ],
          { session: mongoSession }
        );

        if (createdUser.role === USER_ROLES.CLIENT) {
          await Client.create([{ userId: createdUser._id }], {
            session: mongoSession,
          });
        } else if (createdUser.role === USER_ROLES.PHARMACY) {
          // Owner identity must exist without any Pharmacy. The temporary
          // registration upload claims are consumed into Owner documents here,
          // atomically with User creation and audit events.
          const documents = await claimRegistrationOwnerDocuments(
            input.pharmacyDocuments ?? [],
            createdUser._id,
            mongoSession
          );

          const registrationAuditRequestId =
            auditRequestId?.trim() ||
            `service-registration:${String(createdUser._id)}`;

          await appendAdminAuditLog({
            actorUserId: String(createdUser._id),
            action: ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_ACCOUNT_CREATED,
            section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
            entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
            entityId: String(createdUser._id),
            entityLabel: createdUser.name,
            scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
            scopeEntityId: String(createdUser._id),
            before: {},

            after: {
              status: createdUser.status,
              name: createdUser.name,
              email: createdUser.email,
              phone: createdUser.phone,
            },

            changedFields: ['status', 'name', 'email', 'phone'],
            requestId: registrationAuditRequestId,
            session: mongoSession,
          });

          await appendAdminAuditLog({
            actorUserId: String(createdUser._id),

            action:
              ADMIN_AUDIT_ACTIONS.PHARMACY_OWNER_REGISTRATION_DOCUMENTS_ATTACHED,

            section: ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS,
            entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
            entityId: String(createdUser._id),
            entityLabel: createdUser.name,
            scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY_OWNER,
            scopeEntityId: String(createdUser._id),
            before: { documentCount: 0 },

            after: {
              registrationDocuments: documents.map((document) => document.name),
              documentCount: documents.length,
              documentMimeTypes: documents.map((document) => document.type),

              documentSizesBytes: documents.map((document) =>
                String(document.size)
              ),

              totalDocumentSizeBytes: documents.reduce(
                (total, document) => total + document.size,
                0
              ),
            },

            changedFields: [
              'registrationDocuments',
              'documentCount',
              'documentMimeTypes',
              'documentSizesBytes',
              'totalDocumentSizeBytes',
            ],

            requestId: registrationAuditRequestId,
            session: mongoSession,
          });
        }

        return createdUser;
      })) ?? null;
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        API_MESSAGES.EMAIL_IN_USE,
        undefined,

        AUTH_ERROR_CODES.EMAIL_CONFLICT
      );
    }

    if (isDuplicatePhoneError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        API_MESSAGES.PHONE_IN_USE,
        undefined,

        AUTH_ERROR_CODES.PHONE_CONFLICT
      );
    }

    throw error;
  } finally {
    await mongoSession.endSession();
  }

  if (!user) {
    throw new Error('Registration transaction completed without a user.');
  }

  try {
    // Session creation intentionally happens after the identity transaction.
    // A transient session write failure must not roll back a successfully
    // registered User + Client profile/Owner documents; the user can sign in normally.
    return await buildAuthSessionResult(user, context);
  } catch (error) {
    logger.error('[auth] Registration succeeded but session creation failed', {
      userId: String(user._id),
      error,
    });

    throw httpError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      API_MESSAGES.REGISTRATION_SESSION_FAILED,
      undefined,

      AUTH_ERROR_CODES.REGISTRATION_SESSION_FAILED
    );
  }
}
