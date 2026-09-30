import { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_LIMITS,
  ADMIN_AUDIT_SECTIONS,
  getStoredAdminAuditActionValues,
  isAdminAuditAction,
  isAdminAuditEntityType,
  isAdminAuditSection,
  normalizeStoredAdminAuditAction,
  type AdminAuditAction,
  type AdminAuditEntityType,
  type AdminAuditSection,
} from '../constants/admin-audit';

import { USER_ROLES } from '../constants/auth';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AdminAuditLog } from '../models/adminAuditLog.model';
import { User } from '../models/user.model';
import type { AdminAuditListQuery } from '../schemas/admin-audit.schema';

import type {
  AdminAuditActorDto,
  AdminAuditActorsResponseDto,
  AdminAuditDetailsDto,
  AdminAuditListItemDto,
  AdminAuditListResponseDto,
  AdminAuditSnapshot,
  AdminAuditValue,
} from '../types/admin-audit';

import { httpError } from '../utils/httpError';

//===============================================================

const SENSITIVE_AUDIT_KEY_PATTERN =
  /^(?:password|passwordhash|token|accesstoken|refreshtoken|jwt|cookie|authorization|bankdetails|iban|taxid|picture|pictureurl|file|binary|buffer|content)$/i;

//===============================================================

function normalizeAuditString(value: string, label: string, maxLength: number) {
  const normalized = value.trim();

  if (!normalized || normalized.length > maxLength) {
    throw new TypeError(`${label} is invalid for an audit record.`);
  }

  return normalized;
}

//===============================================================

function normalizeAuditValue(
  value: AdminAuditValue,
  fieldName: string
): AdminAuditValue {
  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.length > ADMIN_AUDIT_LIMITS.stringValue) {
      throw new TypeError(`Audit field "${fieldName}" is too large.`);
    }

    return value;
  }

  if (Array.isArray(value)) {
    if (value.length > ADMIN_AUDIT_LIMITS.stringArray) {
      throw new TypeError(
        `Audit field "${fieldName}" contains too many values.`
      );
    }

    if (
      value.some(
        (item) =>
          typeof item !== 'string' ||
          item.length > ADMIN_AUDIT_LIMITS.stringValue
      )
    ) {
      throw new TypeError(
        `Audit field "${fieldName}" contains an unsafe array value.`
      );
    }

    return [...value];
  }

  throw new TypeError(`Audit field "${fieldName}" contains an unsafe value.`);
}

//===============================================================

export function normalizeAdminAuditSnapshot(
  snapshot: AdminAuditSnapshot,
  label: string
): Record<string, AdminAuditValue> {
  const normalized: Record<string, AdminAuditValue> = {};

  for (const [rawKey, value] of Object.entries(snapshot)) {
    const key = rawKey.trim();

    if (
      !key ||
      key.length > ADMIN_AUDIT_LIMITS.fieldName ||
      SENSITIVE_AUDIT_KEY_PATTERN.test(key.replace(/[_.-]/g, ''))
    ) {
      throw new TypeError(`${label} contains a forbidden audit field.`);
    }

    normalized[key] = normalizeAuditValue(value, key);
  }

  return normalized;
}

//===============================================================

function normalizeChangedFields(
  changedFields: readonly string[],
  before: Record<string, AdminAuditValue>,
  after: Record<string, AdminAuditValue>
): string[] {
  const normalized = [...new Set(changedFields.map((field) => field.trim()))]
    .filter(Boolean)
    .sort();

  if (
    normalized.length === 0 ||
    normalized.length > ADMIN_AUDIT_LIMITS.changedFields
  ) {
    throw new TypeError('Audit changedFields is invalid.');
  }

  for (const field of normalized) {
    if (
      field.length > ADMIN_AUDIT_LIMITS.fieldName ||
      SENSITIVE_AUDIT_KEY_PATTERN.test(field.replace(/[_.-]/g, '')) ||
      (!(field in before) && !(field in after))
    ) {
      throw new TypeError('Audit changedFields contains an unsafe field.');
    }
  }

  return normalized;
}

//===============================================================

type AppendAdminAuditLogInput = Readonly<{
  actorUserId: string;
  action: AdminAuditAction;
  section: AdminAuditSection;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabel: string;
  before: AdminAuditSnapshot;
  after: AdminAuditSnapshot;
  changedFields: readonly string[];
  reason?: string;
  requestId: string;
  session: ClientSession;
}>;

//===============================================================

export async function appendAdminAuditLog({
  actorUserId,
  action,
  section,
  entityType,
  entityId,
  entityLabel,
  before: rawBefore,
  after: rawAfter,
  changedFields: rawChangedFields,
  reason,
  requestId,
  session,
}: AppendAdminAuditLogInput): Promise<void> {
  if (!Types.ObjectId.isValid(actorUserId)) {
    throw new TypeError('Audit actorUserId is invalid.');
  }

  if (
    !isAdminAuditAction(action) ||
    !isAdminAuditSection(section) ||
    !isAdminAuditEntityType(entityType)
  ) {
    throw new TypeError('Audit action, section, or entity type is invalid.');
  }

  const before = normalizeAdminAuditSnapshot(
    rawBefore,
    'Audit before snapshot'
  );

  const after = normalizeAdminAuditSnapshot(rawAfter, 'Audit after snapshot');
  const changedFields = normalizeChangedFields(rawChangedFields, before, after);

  const actor = await User.findById(actorUserId)
    .select('_id name')
    .session(session)
    .lean<{ _id: Types.ObjectId; name: string } | null>();

  if (!actor) {
    throw new Error('Audit actor could not be resolved.');
  }

  const normalizedReason = reason?.trim();

  await AdminAuditLog.create(
    [
      {
        actorUserId: actor._id,
        actorNameSnapshot: normalizeAuditString(
          actor.name,
          'Audit actor name',
          ADMIN_AUDIT_LIMITS.actorName
        ),
        action,
        section,
        entityType,
        entityId: normalizeAuditString(
          entityId,
          'Audit entity id',
          ADMIN_AUDIT_LIMITS.entityId
        ),
        entityLabelSnapshot: normalizeAuditString(
          entityLabel,
          'Audit entity label',
          ADMIN_AUDIT_LIMITS.entityLabel
        ),
        before,
        after,
        changedFields,
        ...(normalizedReason
          ? {
              reason: normalizeAuditString(
                normalizedReason,
                'Audit reason',
                ADMIN_AUDIT_LIMITS.reason
              ),
            }
          : {}),
        requestId: normalizeAuditString(
          requestId,
          'Audit request id',
          ADMIN_AUDIT_LIMITS.requestId
        ),
      },
    ],
    { session }
  );
}

//===============================================================

type LeanAuditLog = {
  _id: Types.ObjectId;
  actorUserId: Types.ObjectId;
  actorNameSnapshot: string;
  action: string;
  section?: AdminAuditSection;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabelSnapshot: string;
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
    return ADMIN_AUDIT_SECTIONS.PROFILE;
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

function serializeAuditListItem(log: LeanAuditLog): AdminAuditListItemDto {
  const action = normalizeStoredAdminAuditAction(log.action);

  if (!action) {
    throw new TypeError('Stored admin audit action is invalid.');
  }

  const section = log.section ?? getLegacyAuditSection(log.entityType);

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
    changedFields: [...log.changedFields],
    ...(log.reason ? { reason: log.reason } : {}),
    requestId: log.requestId,
    createdAt: log.createdAt.toISOString(),
  };
}

//===============================================================

function serializeAuditDetails(log: LeanAuditLog): AdminAuditDetailsDto {
  return {
    ...serializeAuditListItem(log),
    before: { ...log.before },
    after: { ...log.after },
  };
}

//===============================================================

function startOfUtcDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

//===============================================================

function endOfUtcDay(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

//===============================================================

const LEGACY_AUDIT_SECTION_ENTITY_TYPES: Readonly<
  Record<AdminAuditSection, readonly AdminAuditEntityType[]>
> = {
  [ADMIN_AUDIT_SECTIONS.PROFILE]: [
    ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE,
    ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE_DOCUMENT,
  ],
  [ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS]: [],
  [ADMIN_AUDIT_SECTIONS.PHARMACIES]: [ADMIN_AUDIT_ENTITY_TYPES.PHARMACY],
  [ADMIN_AUDIT_SECTIONS.PRODUCTS]: [],
  [ADMIN_AUDIT_SECTIONS.PRODUCT_REQUESTS]: [
    ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST,
  ],
  [ADMIN_AUDIT_SECTIONS.CLIENTS]: [],
  [ADMIN_AUDIT_SECTIONS.ORDERS]: [],
  [ADMIN_AUDIT_SECTIONS.PRODUCT_REVIEWS]: [],
  [ADMIN_AUDIT_SECTIONS.PHARMACY_REVIEWS]: [],
  [ADMIN_AUDIT_SECTIONS.EMPLOYEES]: [ADMIN_AUDIT_ENTITY_TYPES.ADMIN_ACCESS],
  [ADMIN_AUDIT_SECTIONS.POSITIONS]: [],
  [ADMIN_AUDIT_SECTIONS.SITE_PAGES]: [],
  [ADMIN_AUDIT_SECTIONS.CATEGORIES]: [],
};

//===============================================================

function applyAuditSectionFilter(
  filter: Record<string, unknown>,
  section: AdminAuditSection
): void {
  filter.$or = [
    { section },
    {
      section: { $exists: false },
      entityType: { $in: LEGACY_AUDIT_SECTION_ENTITY_TYPES[section] },
    },
  ];
}

//===============================================================

export async function listAdminAuditActorsService(): Promise<AdminAuditActorsResponseDto> {
  const actors = await User.find({ role: USER_ROLES.ADMIN })
    .select('_id name email phone address pictureUrl status')
    .sort({ name: 1, _id: 1 })
    .lean<
      Array<{
        _id: Types.ObjectId;
        name: string;
        email: string;
        phone: string;
        address?: string;
        pictureUrl?: string;
        status: 'active' | 'blocked';
      }>
    >();

  const items: AdminAuditActorDto[] = actors.map((actor) => ({
    id: String(actor._id),
    name: actor.name,
    email: actor.email,
    phone: actor.phone,
    ...(actor.address ? { address: actor.address } : {}),
    ...(actor.pictureUrl ? { pictureUrl: actor.pictureUrl } : {}),
    status: actor.status,
  }));

  return { items };
}

//===============================================================

export async function listAdminAuditLogsService(
  query: AdminAuditListQuery
): Promise<AdminAuditListResponseDto> {
  const filter: Record<string, unknown> = {};

  if (query.action) {
    filter.action = { $in: getStoredAdminAuditActionValues(query.action) };
  }

  if (query.section) applyAuditSectionFilter(filter, query.section);
  if (query.entityType) filter.entityType = query.entityType;
  if (query.entityId) filter.entityId = query.entityId;
  if (query.actorUserId)
    filter.actorUserId = new Types.ObjectId(query.actorUserId);
  if (query.requestId) filter.requestId = query.requestId;

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {
      ...(query.dateFrom ? { $gte: startOfUtcDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { $lte: endOfUtcDay(query.dateTo) } : {}),
    };
  }

  const skip = (query.page - 1) * query.perPage;

  const [total, items, earliestLog] = await Promise.all([
    AdminAuditLog.countDocuments(filter),
    AdminAuditLog.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.perPage)
      .lean<LeanAuditLog[]>(),
    AdminAuditLog.findOne({})
      .sort({ createdAt: 1, _id: 1 })
      .select('createdAt')
      .lean<{ createdAt: Date } | null>(),
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
  };
}

//===============================================================

export async function getAdminAuditLogService(
  auditLogId: string
): Promise<AdminAuditDetailsDto> {
  if (!Types.ObjectId.isValid(auditLogId)) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Audit record was not found.');
  }

  const auditLog = await AdminAuditLog.findById(
    auditLogId
  ).lean<LeanAuditLog | null>();

  if (!auditLog) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Audit record was not found.');
  }

  return serializeAuditDetails(auditLog);
}
