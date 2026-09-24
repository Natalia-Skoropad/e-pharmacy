import type {
  AdminAuditAction,
  AdminAuditEntityType,
  AdminAuditValue,
} from './admin-audit';

//===================================================================

const ACTION_LABELS: Record<AdminAuditAction, string> = {
  'pharmacy.status.changed': 'Pharmacy status changed',
  'productRequest.status.changed': 'Product request status changed',
  'admin.platformOwner.granted': 'Platform Owner granted',
  'admin.platformOwner.revoked': 'Platform Owner removed',
};

//===================================================================

const ENTITY_LABELS: Record<AdminAuditEntityType, string> = {
  pharmacy: 'Pharmacy',
  productRequest: 'Product request',
  adminAccess: 'Admin access',
};

//===================================================================

export function getAdminAuditActionLabel(action: AdminAuditAction): string {
  return ACTION_LABELS[action];
}

//===================================================================

export function getAdminAuditEntityLabel(
  entityType: AdminAuditEntityType
): string {
  return ENTITY_LABELS[entityType];
}

//===================================================================

export function formatAdminAuditValue(
  value: AdminAuditValue | undefined
): string {
  if (value === undefined) return '—';
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
  return String(value);
}
