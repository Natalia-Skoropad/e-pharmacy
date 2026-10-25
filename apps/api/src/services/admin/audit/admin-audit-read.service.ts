import { Types } from 'mongoose';

import {
  getStoredAdminAuditActionValues,
  isAdminAuditSection,
  normalizeStoredAdminAuditAction,
  type AdminAuditAction,
  type AdminAuditSection,
} from '../../../constants/admin/audit/admin-audit';

import { HTTP_STATUS } from '../../../constants/http/httpStatus';
import { AdminAuditLog } from '../../../models/audit/adminAuditLog.model';

import type { AdminAuditListQuery } from '../../../schemas/admin/audit/admin-audit.schema';

import type {
  AdminAuditDetailsDto,
  AdminAuditListResponseDto,
} from '../../../types/admin-audit';

import { httpError } from '../../../utils/httpError';

import { getAuditActorIdsByType } from './admin-audit-actors.service';

import {
  applyAuditSectionFilter,
  buildPharmacyAuditScopeFilter,
  endOfUtcDay,
  startOfUtcDay,
} from './admin-audit-filters';

import {
  serializeAuditDetails,
  serializeAuditListItem,
  type LeanAuditLog,
} from './admin-audit-projection';

//===============================================================

type AuditListScope = Readonly<{ pharmacyId: string }>;

//===============================================================

export async function listAdminAuditLogsService(
  query: AdminAuditListQuery,
  exactScope?: AuditListScope
): Promise<AdminAuditListResponseDto> {
  const filter: Record<string, unknown> = {};

  if (query.action) {
    filter.action = { $in: getStoredAdminAuditActionValues(query.action) };
  }

  if (query.section) applyAuditSectionFilter(filter, query.section);
  if (query.entityType) filter.entityType = query.entityType;
  if (query.entityId) filter.entityId = query.entityId;
  if (query.scopeEntityType) filter.scopeEntityType = query.scopeEntityType;
  if (query.scopeEntityId) filter.scopeEntityId = query.scopeEntityId;

  if (query.actorType) {
    const actorIds = await getAuditActorIdsByType(query.actorType);

    if (query.actorUserId) {
      const actorUserId = new Types.ObjectId(query.actorUserId);
      const matchesActorType = actorIds.some((id) => id.equals(actorUserId));

      filter.actorUserId = matchesActorType ? actorUserId : { $in: [] };
    } else {
      filter.actorUserId = { $in: actorIds };
    }
  } else if (query.actorUserId) {
    filter.actorUserId = new Types.ObjectId(query.actorUserId);
  }

  if (query.requestId) filter.requestId = query.requestId;

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {
      ...(query.dateFrom ? { $gte: startOfUtcDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { $lte: endOfUtcDay(query.dateTo) } : {}),
    };
  }

  const exactPharmacyFilter = exactScope
    ? buildPharmacyAuditScopeFilter(exactScope.pharmacyId)
    : null;

  if (exactPharmacyFilter) {
    // AND rather than replacing section/action filters (which use $or).
    filter.$and = [exactPharmacyFilter];
  }

  const skip = (query.page - 1) * query.perPage;

  // Keep the calendar bounds and action facets scoped to the selected owner,
  // but independent of pagination and the currently selected filters.
  const scopeFilter: Record<string, unknown> = exactPharmacyFilter
    ? { $and: [exactPharmacyFilter] }
    : {};

  if (query.scopeEntityType)
    scopeFilter.scopeEntityType = query.scopeEntityType;

  if (query.scopeEntityId) scopeFilter.scopeEntityId = query.scopeEntityId;

  const [total, items, earliestLog, storedActions, storedSections] =
    await Promise.all([
      AdminAuditLog.countDocuments(filter),

      AdminAuditLog.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(query.perPage)
        .lean<LeanAuditLog[]>(),

      AdminAuditLog.findOne(scopeFilter)
        .sort({ createdAt: 1, _id: 1 })
        .select('createdAt')
        .lean<{ createdAt: Date } | null>(),

      AdminAuditLog.distinct('action', scopeFilter),
      AdminAuditLog.distinct('section', scopeFilter),
    ]);

  return {
    items: items.map(serializeAuditListItem),
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),

    earliestCreatedAt: earliestLog
      ? earliestLog.createdAt.toISOString().slice(0, 10)
      : null,

    availableSections: storedSections.filter(
      (section): section is AdminAuditSection => isAdminAuditSection(section)
    ),

    availableActions: storedActions
      .map((action) => normalizeStoredAdminAuditAction(String(action)))
      .filter((action): action is AdminAuditAction => action !== null)
      .filter((action, index, actions) => actions.indexOf(action) === index),
  };
}

//===============================================================

export async function getAdminAuditLogService(
  auditLogId: string,
  exactScope?: AuditListScope
): Promise<AdminAuditDetailsDto> {
  if (!Types.ObjectId.isValid(auditLogId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Audit record was not found.');
  }

  const auditLog = await AdminAuditLog.findOne({
    _id: new Types.ObjectId(auditLogId),
    ...(exactScope ? buildPharmacyAuditScopeFilter(exactScope.pharmacyId) : {}),
  }).lean<LeanAuditLog | null>();

  if (!auditLog) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Audit record was not found.');
  }

  return serializeAuditDetails(auditLog);
}
