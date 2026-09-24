import type { Types } from 'mongoose';

import type {
  AdminAuditAction,
  AdminAuditEntityType,
} from '../constants/admin-audit';

//===============================================================

export type AdminAuditScalar = string | number | boolean | null;
export type AdminAuditValue = AdminAuditScalar | readonly string[];
export type AdminAuditSnapshot = Readonly<Record<string, AdminAuditValue>>;

//===============================================================

export type AdminAuditLogEntity = {
  actorUserId: Types.ObjectId;
  actorNameSnapshot: string;
  action: AdminAuditAction;
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

export type AdminAuditListItemDto = Readonly<{
  id: string;
  actorUserId: string;
  actorNameSnapshot: string;
  action: AdminAuditAction;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabelSnapshot: string;
  changedFields: string[];
  reason?: string;
  requestId: string;
  createdAt: string;
}>;

export type AdminAuditDetailsDto = AdminAuditListItemDto &
  Readonly<{
    before: Record<string, AdminAuditValue>;
    after: Record<string, AdminAuditValue>;
  }>;
