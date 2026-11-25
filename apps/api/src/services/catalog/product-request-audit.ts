import { createHash } from 'node:crypto';
import { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
  type AdminAuditAction,
} from '../../constants/admin/audit/admin-audit';

import type {
  AdminAuditSnapshot,
  AdminAuditValue,
} from '../../types/admin/audit/admin-audit';

import type { ProductRequestEntity } from '../../types/catalog/product-request';

import { appendAdminAuditLog } from '../admin/audit/admin-audit-write.service';

//===============================================================

// Store the user-visible metadata and hashes, never file bytes or data URLs.
function text(value?: string): AdminAuditValue {
  if (!value) return null;
  if (value.length <= 2000) return value;

  return value.match(/[\s\S]{1,2000}/g) ?? [];
}

//===============================================================

export function productRequestAuditSnapshot(
  request: Partial<ProductRequestEntity>
): AdminAuditSnapshot {
  return {
    exists: true,
    name: text(request.name),
    article: text(request.article),
    categoryMode: request.categoryMode ?? null,
    categoryId: request.categoryId ? String(request.categoryId) : null,
    customCategory: text(request.customCategory),
    status: request.status ?? null,
    reviewState: request.reviewState ?? null,
    cancelledBy: request.cancelledBy ?? null,
    productId: request.productId ? String(request.productId) : null,
    brand: text(request.brand),
    series: text(request.series),
    manufacturer: text(request.manufacturer),
    releaseForm: text(request.releaseForm),
    activeIngredients: text(request.activeIngredients),
    activeIngredientCount: text(request.activeIngredientCount),
    fullDescription: text(request.fullDescription),
    pharmacyComment: text(request.pharmacyComment),
    rejectionReason: text(request.rejectionReason),

    productImageFingerprint: request.productImage?.dataUrl
      ? createHash('sha256').update(request.productImage.dataUrl).digest('hex')
      : null,

    productImageName: text(request.productImage?.name),

    additionalFiles: (request.additionalFiles ?? []).map(
      (file) =>
        `${file.name} (${file.type}, ${file.size} bytes) ${file.documentId ?? (file.dataUrl ? createHash('sha256').update(file.dataUrl).digest('hex') : '')}`
    ),
  };
}

//===============================================================

export function productRequestChangedFields(
  before: AdminAuditSnapshot,
  after: AdminAuditSnapshot
): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
  );
}

//===============================================================

export async function auditProductRequestMutation(input: {
  actorUserId: string;
  entityId: string;
  entityLabel: string;
  action: AdminAuditAction;
  before: AdminAuditSnapshot;
  after: AdminAuditSnapshot;
  session: ClientSession;
  requestId?: string;
  reason?: string;
}) {
  const changedFields = productRequestChangedFields(input.before, input.after);

  if (!changedFields.length) return;

  await appendAdminAuditLog({
    ...input,
    section: ADMIN_AUDIT_SECTIONS.PRODUCT_REQUESTS,
    entityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST,
    changedFields,
    requestId: input.requestId ?? String(new Types.ObjectId()),
  });
}

//===============================================================

export { ADMIN_AUDIT_ACTIONS };
