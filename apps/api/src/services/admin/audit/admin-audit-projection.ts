import { Types } from 'mongoose';

import { resolvePharmacyAuditStatusContext } from '../../pharmacies/pharmacy-audit-status-context';

import {
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
  isAdminAuditSection,
  normalizeStoredAdminAuditAction,
  type AdminAuditEntityType,
  type AdminAuditSection,
} from '../../../constants/admin/audit/admin-audit';

import type {
  AdminAuditDetailsDto,
  AdminAuditListItemDto,
  AdminAuditValue,
} from '../../../types/admin/audit/admin-audit';

//===============================================================

export type LeanAuditLog = {
  _id: Types.ObjectId;
  actorUserId: Types.ObjectId;
  actorNameSnapshot: string;
  action: string;
  section?: AdminAuditSection;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabelSnapshot: string;
  scopeEntityType?: AdminAuditEntityType;
  scopeEntityId?: string;
  pharmacyId?: string;
  before: Record<string, AdminAuditValue>;
  after: Record<string, AdminAuditValue>;
  changedFields: string[];
  reason?: string;
  requestId: string;
  createdAt: Date;
};

//===============================================================

function getLegacyAuditSection(
  entityType: AdminAuditEntityType
): AdminAuditSection {
  if (
    entityType === ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE ||
    entityType === ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE_DOCUMENT
  ) {
    return ADMIN_AUDIT_SECTIONS.EMPLOYEES;
  }

  if (entityType === ADMIN_AUDIT_ENTITY_TYPES.ADMIN_ACCESS) {
    return ADMIN_AUDIT_SECTIONS.EMPLOYEES;
  }

  if (entityType === ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST) {
    return ADMIN_AUDIT_SECTIONS.PRODUCT_REQUESTS;
  }

  return ADMIN_AUDIT_SECTIONS.PHARMACIES;
}

//===============================================================

export function serializeAuditListItem(
  log: LeanAuditLog
): AdminAuditListItemDto {
  const action = normalizeStoredAdminAuditAction(log.action);

  if (!action) {
    throw new TypeError('Stored admin audit action is invalid.');
  }

  const storedSection = log.section ?? getLegacyAuditSection(log.entityType);

  const section =
    storedSection === ADMIN_AUDIT_SECTIONS.PROFILE
      ? ADMIN_AUDIT_SECTIONS.EMPLOYEES
      : storedSection;

  const hasStatusChange =
    log.changedFields.includes('status') ||
    (log.entityType === ADMIN_AUDIT_ENTITY_TYPES.PHARMACY &&
      log.changedFields.includes('reviewState'));

  const reviewContext =
    hasStatusChange && log.entityType === ADMIN_AUDIT_ENTITY_TYPES.PHARMACY
      ? resolvePharmacyAuditStatusContext({
          action,
          before: log.before,
          after: log.after,
        })
      : null;

  const statusBefore = hasStatusChange
    ? (reviewContext?.previousStatus ??
      (typeof log.before.status === 'string' ? log.before.status : undefined))
    : undefined;

  const statusAfter = hasStatusChange
    ? (reviewContext?.nextStatus ??
      (typeof log.after.status === 'string' ? log.after.status : undefined))
    : undefined;

  if (!isAdminAuditSection(section)) {
    throw new TypeError('Stored admin audit section is invalid.');
  }

  return {
    id: String(log._id),
    actorUserId: String(log.actorUserId),
    actorNameSnapshot: log.actorNameSnapshot,
    action,
    section,
    entityType: log.entityType,
    entityId: log.entityId,
    entityLabelSnapshot: log.entityLabelSnapshot,

    ...(log.scopeEntityType && log.scopeEntityId
      ? {
          scopeEntityType: log.scopeEntityType,
          scopeEntityId: log.scopeEntityId,
        }
      : {}),

    ...(log.pharmacyId ? { pharmacyId: log.pharmacyId } : {}),

    changedFields: [...log.changedFields],

    ...(statusBefore ? { statusBefore } : {}),
    ...(statusAfter ? { statusAfter } : {}),
    ...(log.reason ? { reason: log.reason } : {}),

    requestId: log.requestId,
    createdAt: log.createdAt.toISOString(),
  };
}

//===============================================================

export function serializeAuditDetails(log: LeanAuditLog): AdminAuditDetailsDto {
  return {
    ...serializeAuditListItem(log),

    before: { ...log.before },
    after: { ...log.after },
  };
}
