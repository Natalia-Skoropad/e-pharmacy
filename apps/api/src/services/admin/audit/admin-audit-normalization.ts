import { ADMIN_AUDIT_LIMITS } from '../../../constants/admin/audit/admin-audit';

import type {
  AdminAuditSnapshot,
  AdminAuditValue,
} from '../../../types/admin-audit';

//===============================================================

const SENSITIVE_AUDIT_KEY_PATTERN =
  /^(?:password|passwordhash|token|accesstoken|refreshtoken|jwt|cookie|authorization|bankdetails|iban|taxid|picture|pictureurl|photo|photourl|image|imageurl|base64|dataurl|sha256|file|binary|buffer|content)$/i;

//===============================================================

export function normalizeAuditString(
  value: string,
  label: string,
  maxLength: number
) {
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

export function normalizeChangedFields(
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
