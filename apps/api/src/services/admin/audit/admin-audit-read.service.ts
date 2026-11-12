import { Types } from 'mongoose';

import {
  getStoredAdminAuditActionValues,
  ADMIN_AUDIT_ACTION_VALUES,
  isAdminAuditSection,
  normalizeStoredAdminAuditAction,
  type AdminAuditAction,
  type AdminAuditSection,
} from '../../../constants/admin/audit/admin-audit';

import { HTTP_STATUS } from '../../../constants/http/httpStatus';
import { AdminAuditLog } from '../../../models/audit/adminAuditLog.model';
import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';

import {
  recoverBlockSourceFromStatusChange,
  resolvePreviousPharmacyBlockSources,
} from '../../pharmacies/pharmacy-block-source-read.service';

import type { AdminAuditListQuery } from '../../../schemas/admin/audit/admin-audit.schema';

import type {
  AdminAuditDetailsDto,
  AdminAuditListResponseDto,
} from '../../../types/admin/audit/admin-audit';

import { httpError } from '../../../utils/http/httpError';

import { getAuditActorIdsByType } from './admin-audit-actors.service';

import {
  getAdminAuditPhotoSides,
  getRecoverableLegacyAuditPhotoSides,
} from './admin-audit-photo.service';

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

  // One user-facing status category encompasses all lifecycle audit actions.
  // Keep the filtering on MongoDB to preserve accurate pagination and totals.
  if (query.changeType) {
    const statusActions = ADMIN_AUDIT_ACTION_VALUES.filter(
      (action) =>
        action === 'pharmacy.created' ||
        action === 'pharmacy.status.changed' ||
        action === 'pharmacy.moderation.submitted' ||
        action === 'pharmacy.corrections.requested' ||
        action.startsWith('pharmacy.reactivation.') ||
        action === 'pharmacy.verification.withdrawn' ||
        action === 'pharmacy.moderation.withdrawn'
    );

    filter.action =
      query.changeType === 'status'
        ? { $in: statusActions }
        : { $nin: statusActions };
  }

  if (query.section) applyAuditSectionFilter(filter, query.section);
  else if (query.changeType && !exactScope) {
    applyAuditSectionFilter(filter, 'pharmacies');
  }

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

  if (
    query.scopeEntityType === 'pharmacyOwner' &&
    query.section === 'pharmacyOwners'
  ) {
    applyAuditSectionFilter(scopeFilter, 'pharmacyOwners');
  }

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

  let details = serializeAuditDetails(auditLog);

  // Legacy blocking audit records may predate blockSource snapshots. Recover
  // provenance from the immutable blocking actor + the owner ID, only if
  // those identities are available. This also works for deleted actors.
  if (
    auditLog.entityType === 'pharmacy' &&
    details.action === 'pharmacy.status.changed' &&
    auditLog.after?.status === 'blocked' &&
    auditLog.after?.blockSource !== 'owner_deactivated' &&
    auditLog.after?.blockSource !== 'admin_blocked'
  ) {
    const ownerIdFromAudit =
      auditLog.scopeEntityType === 'pharmacyOwner'
        ? auditLog.scopeEntityId
        : undefined;

    const currentPharmacy =
      ownerIdFromAudit || !Types.ObjectId.isValid(auditLog.entityId)
        ? null
        : await Pharmacy.findById(auditLog.entityId)
            .select('ownerId')
            .lean<{ ownerId: Types.ObjectId } | null>();

    const recovered = recoverBlockSourceFromStatusChange(
      {
        entityId: auditLog.entityId,
        actorUserId: auditLog.actorUserId,
        after: {
          status: 'blocked',
        },
      },

      ownerIdFromAudit ??
        (currentPharmacy ? String(currentPharmacy.ownerId) : undefined)
    );

    if (recovered) {
      details = {
        ...details,
        after: { ...details.after, blockSource: recovered },
      };
    }
  }

  // Reactivation requests made before blockSource was included in audit
  // snapshots must show the source of the preceding block, not the owner who
  // submitted the reactivation request. Keep the stored audit immutable.
  if (
    auditLog.entityType === 'pharmacy' &&
    auditLog.before?.status === 'blocked' &&
    auditLog.before?.blockSource !== 'owner_deactivated' &&
    auditLog.before?.blockSource !== 'admin_blocked'
  ) {
    const ownerIdFromAudit =
      auditLog.scopeEntityType === 'pharmacyOwner'
        ? auditLog.scopeEntityId
        : undefined;

    const currentPharmacy =
      ownerIdFromAudit || !Types.ObjectId.isValid(auditLog.entityId)
        ? null
        : await Pharmacy.findById(auditLog.entityId)
            .select('ownerId')
            .lean<{ ownerId: Types.ObjectId } | null>();

    const sources = await resolvePreviousPharmacyBlockSources(
      auditLog.entityId,

      ownerIdFromAudit ??
        (currentPharmacy ? String(currentPharmacy.ownerId) : undefined),
      [{ id: String(auditLog._id), createdAt: auditLog.createdAt }]
    );

    const source = sources.get(String(auditLog._id));

    if (source) {
      details = {
        ...details,
        before: { ...details.before, blockSource: source },
      };
    }
  }

  if (
    auditLog.entityType !== 'pharmacy' ||
    !auditLog.changedFields.includes('photoFingerprint')
  ) {
    return details;
  }

  const archivedSides = await getAdminAuditPhotoSides(auditLog._id);

  const legacySides = await getRecoverableLegacyAuditPhotoSides(
    auditLog.entityId,
    {
      before: auditLog.before?.photoFingerprint,
      after: auditLog.after?.photoFingerprint,
    },
    archivedSides
  );

  const sides = [...new Set([...archivedSides, ...legacySides])];

  if (!sides.length) return details;

  // These same-origin, permission-gated URLs return the frozen photo bytes,
  // never the current image of a pharmacy. This also works when a scoped
  // pharmacy activity viewer does not have the global audit.view permission.
  const photoBase = exactScope
    ? `/api/admin/pharmacies/${exactScope.pharmacyId}/activity/${auditLogId}/photos`
    : `/api/admin/audit/${auditLogId}/photos`;

  const photoUrl = (side: 'before' | 'after') => `${photoBase}/${side}`;

  return {
    ...details,

    before: {
      ...details.before,

      ...(sides.includes('before')
        ? { photoPreviewUrl: photoUrl('before') }
        : {}),
    },

    after: {
      ...details.after,

      ...(sides.includes('after')
        ? { photoPreviewUrl: photoUrl('after') }
        : {}),
    },
  };
}
