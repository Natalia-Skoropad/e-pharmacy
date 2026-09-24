export const ADMIN_AUDIT_ACTIONS = {
  PHARMACY_STATUS_CHANGED: 'pharmacy.status.changed',
  PRODUCT_REQUEST_STATUS_CHANGED: 'productRequest.status.changed',
  PLATFORM_OWNER_GRANTED: 'admin.platformOwner.granted',
  PLATFORM_OWNER_REVOKED: 'admin.platformOwner.revoked',
  ADMIN_EMPLOYEE_DOCUMENT_UPLOADED: 'admin.employeeDocument.uploaded',
  ADMIN_EMPLOYEE_DOCUMENT_REPLACED: 'admin.employeeDocument.replaced',
  ADMIN_EMPLOYEE_DOCUMENT_DELETED: 'admin.employeeDocument.deleted',
} as const;

//===============================================================

export type AdminAuditAction =
  (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS];

export const ADMIN_AUDIT_ACTION_VALUES = Object.freeze(
  Object.values(ADMIN_AUDIT_ACTIONS) as AdminAuditAction[]
);

const ADMIN_AUDIT_ACTION_SET = new Set<string>(ADMIN_AUDIT_ACTION_VALUES);

//===============================================================

export function isAdminAuditAction(value: unknown): value is AdminAuditAction {
  return typeof value === 'string' && ADMIN_AUDIT_ACTION_SET.has(value);
}

//===============================================================

export const ADMIN_AUDIT_ENTITY_TYPES = {
  PHARMACY: 'pharmacy',
  PRODUCT_REQUEST: 'productRequest',
  ADMIN_ACCESS: 'adminAccess',
  ADMIN_EMPLOYEE_DOCUMENT: 'adminEmployeeDocument',
} as const;

export type AdminAuditEntityType =
  (typeof ADMIN_AUDIT_ENTITY_TYPES)[keyof typeof ADMIN_AUDIT_ENTITY_TYPES];

export const ADMIN_AUDIT_ENTITY_TYPE_VALUES = Object.freeze(
  Object.values(ADMIN_AUDIT_ENTITY_TYPES) as AdminAuditEntityType[]
);

const ADMIN_AUDIT_ENTITY_TYPE_SET = new Set<string>(
  ADMIN_AUDIT_ENTITY_TYPE_VALUES
);

//===============================================================

export function isAdminAuditEntityType(
  value: unknown
): value is AdminAuditEntityType {
  return typeof value === 'string' && ADMIN_AUDIT_ENTITY_TYPE_SET.has(value);
}

//===============================================================

export const ADMIN_AUDIT_LIMITS = {
  actorName: 160,
  entityId: 256,
  entityLabel: 240,
  reason: 1000,
  requestId: 128,
  changedFields: 50,
  fieldName: 100,
  stringValue: 2000,
  stringArray: 100,
} as const;
