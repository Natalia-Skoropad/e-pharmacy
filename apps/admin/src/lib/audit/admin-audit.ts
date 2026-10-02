import { isCalendarDateString } from '@e-pharmacy/validation/dates';

export const ADMIN_AUDIT_ACTIONS = [
  'pharmacy.status.changed',
  'pharmacyOwner.status.changed',
  'productRequest.status.changed',
  'admin.platformOwner.granted',
  'admin.platformOwner.revoked',
  'adminEmployee.profile.updated',
  'adminEmployee.document.uploaded',
  'adminEmployee.document.replaced',
  'adminEmployee.document.deleted',
  'productCategory.created',
  'productCategory.updated',
  'productCategory.deleted',
  'position.created',
  'position.updated',
  'position.deleted',
] as const;

//===================================================================

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

//===================================================================

export const ADMIN_AUDIT_ENTITY_TYPES = [
  'pharmacy',
  'pharmacyOwner',
  'productRequest',
  'adminAccess',
  'adminEmployee',
  'adminEmployeeDocument',
  'productCategory',
  'position',
] as const;

//===================================================================

export type AdminAuditEntityType = (typeof ADMIN_AUDIT_ENTITY_TYPES)[number];

//===================================================================

export const ADMIN_AUDIT_SECTIONS = [
  'profile',
  'pharmacyOwners',
  'pharmacies',
  'products',
  'productRequests',
  'clients',
  'orders',
  'productReviews',
  'pharmacyReviews',
  'employees',
  'positions',
  'sitePages',
  'categories',
] as const;

//===================================================================

export type AdminAuditSection = (typeof ADMIN_AUDIT_SECTIONS)[number];

//===================================================================

export type AdminAuditValue =
  | string
  | number
  | boolean
  | null
  | readonly string[];

//===================================================================

export type AdminAuditSnapshot = Readonly<Record<string, AdminAuditValue>>;

//===================================================================

export type AdminAuditActor = Readonly<{
  id: string;
  name: string;
  email: string;
  phone: string;
  pictureUrl?: string;
  status: 'active' | 'blocked';
}>;

export type AdminAuditActorsResponse = Readonly<{
  items: readonly AdminAuditActor[];
}>;

//===================================================================

export type AdminAuditListItem = Readonly<{
  id: string;
  actorUserId: string;
  actorNameSnapshot: string;
  action: AdminAuditAction;
  section: AdminAuditSection;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabelSnapshot: string;
  changedFields: readonly string[];
  statusBefore?: string;
  statusAfter?: string;
  reason?: string;
  requestId: string;
  createdAt: string;
}>;

export type AdminAuditDetails = AdminAuditListItem &
  Readonly<{
    before: AdminAuditSnapshot;
    after: AdminAuditSnapshot;
  }>;

export type AdminAuditListResponse = Readonly<{
  items: readonly AdminAuditListItem[];
  page: number;
  perPage: 20 | 50 | 100;
  total: number;
  totalPages: number;
  earliestCreatedAt: string | null;
}>;

export type AdminAuditDetailsResponse = Readonly<{
  auditLog: AdminAuditDetails;
}>;

export type AdminAuditQueryParams = Readonly<{
  page?: number;
  perPage?: 20 | 50 | 100;
  dateFrom?: string;
  dateTo?: string;
  action?: AdminAuditAction;
  entityType?: AdminAuditEntityType;
  section?: AdminAuditSection;
  entityId?: string;
  actorUserId?: string;
  requestId?: string;
}>;

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

function isAdminAuditAction(value: unknown): value is AdminAuditAction {
  return (
    typeof value === 'string' &&
    (ADMIN_AUDIT_ACTIONS as readonly string[]).includes(value)
  );
}

//===================================================================

function isAdminAuditEntityType(value: unknown): value is AdminAuditEntityType {
  return (
    typeof value === 'string' &&
    (ADMIN_AUDIT_ENTITY_TYPES as readonly string[]).includes(value)
  );
}

//===================================================================

function isAdminAuditSection(value: unknown): value is AdminAuditSection {
  return (
    typeof value === 'string' &&
    (ADMIN_AUDIT_SECTIONS as readonly string[]).includes(value)
  );
}

//===================================================================

function parseStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new TypeError(`Invalid ${label}.`);
  }

  return [...value];
}

//===================================================================

function parseAuditValue(value: unknown): AdminAuditValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return [...value];
  }

  throw new TypeError('Invalid audit snapshot value.');
}

//===================================================================

function parseAuditSnapshot(value: unknown): AdminAuditSnapshot {
  if (!isRecord(value)) throw new TypeError('Invalid audit snapshot.');

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, parseAuditValue(item)])
  );
}

//===================================================================

function parseListItem(value: unknown): AdminAuditListItem {
  if (!isRecord(value)) throw new TypeError('Invalid audit item.');

  if (
    typeof value.id !== 'string' ||
    typeof value.actorUserId !== 'string' ||
    typeof value.actorNameSnapshot !== 'string' ||
    !isAdminAuditAction(value.action) ||
    !isAdminAuditSection(value.section) ||
    !isAdminAuditEntityType(value.entityType) ||
    typeof value.entityId !== 'string' ||
    typeof value.entityLabelSnapshot !== 'string' ||
    typeof value.requestId !== 'string' ||
    typeof value.createdAt !== 'string' ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    (value.statusBefore !== undefined &&
      typeof value.statusBefore !== 'string') ||
    (value.statusAfter !== undefined &&
      typeof value.statusAfter !== 'string') ||
    (value.reason !== undefined && typeof value.reason !== 'string')
  ) {
    throw new TypeError('Invalid audit item.');
  }

  return {
    id: value.id,
    actorUserId: value.actorUserId,
    actorNameSnapshot: value.actorNameSnapshot,
    action: value.action,
    section: value.section,
    entityType: value.entityType,
    entityId: value.entityId,
    entityLabelSnapshot: value.entityLabelSnapshot,
    changedFields: parseStringArray(value.changedFields, 'changedFields'),
    ...(typeof value.statusBefore === 'string'
      ? { statusBefore: value.statusBefore }
      : {}),
    ...(typeof value.statusAfter === 'string'
      ? { statusAfter: value.statusAfter }
      : {}),
    ...(typeof value.reason === 'string' ? { reason: value.reason } : {}),
    requestId: value.requestId,
    createdAt: value.createdAt,
  };
}

//===================================================================

function parseAuditActor(value: unknown): AdminAuditActor {
  if (!isRecord(value)) throw new TypeError('Invalid audit actor.');

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.email !== 'string' ||
    typeof value.phone !== 'string' ||
    value.address !== undefined ||
    (value.pictureUrl !== undefined && typeof value.pictureUrl !== 'string') ||
    (value.status !== 'active' && value.status !== 'blocked')
  ) {
    throw new TypeError('Invalid audit actor.');
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    phone: value.phone,
    ...(typeof value.pictureUrl === 'string'
      ? { pictureUrl: value.pictureUrl }
      : {}),
    status: value.status,
  };
}

//===================================================================

export function parseAdminAuditActorsResponse(
  value: unknown
): AdminAuditActorsResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new TypeError('Invalid audit actors response.');
  }

  return { items: value.items.map(parseAuditActor) };
}

//===================================================================

export function parseAdminAuditListResponse(
  value: unknown
): AdminAuditListResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new TypeError('Invalid audit list response.');
  }

  if (
    !Number.isInteger(value.page) ||
    !Number.isInteger(value.perPage) ||
    !Number.isInteger(value.total) ||
    !Number.isInteger(value.totalPages) ||
    (value.earliestCreatedAt !== null &&
      !isCalendarDateString(value.earliestCreatedAt)) ||
    (value.perPage !== 20 && value.perPage !== 50 && value.perPage !== 100) ||
    (value.page as number) < 1 ||
    (value.total as number) < 0 ||
    (value.totalPages as number) < 0
  ) {
    throw new TypeError('Invalid audit pagination response.');
  }

  return {
    items: value.items.map(parseListItem),
    page: value.page as number,
    perPage: value.perPage as 20 | 50 | 100,
    total: value.total as number,
    totalPages: value.totalPages as number,
    earliestCreatedAt: value.earliestCreatedAt as string | null,
  };
}

//===================================================================

export function parseAdminAuditDetailsResponse(
  value: unknown
): AdminAuditDetailsResponse {
  if (!isRecord(value) || !isRecord(value.auditLog)) {
    throw new TypeError('Invalid audit details response.');
  }

  const auditLog = parseListItem(value.auditLog);

  return {
    auditLog: {
      ...auditLog,
      before: parseAuditSnapshot(value.auditLog.before),
      after: parseAuditSnapshot(value.auditLog.after),
    },
  };
}
