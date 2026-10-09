import type { Types } from 'mongoose';

import type {
  AdminAuditAction,
  AdminAuditActorType,
  AdminAuditEntityType,
  AdminAuditSection,
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
  section: AdminAuditSection;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabelSnapshot: string;
  scopeEntityType?: AdminAuditEntityType;
  scopeEntityId?: string;
  before: Record<string, AdminAuditValue>;
  after: Record<string, AdminAuditValue>;
  changedFields: string[];
  reason?: string;
  requestId: string;
  createdAt: Date;
};

//===============================================================

export type AdminAuditActorDto = Readonly<{
  id: string;
  name: string;
  email: string;
  phone: string;
  pictureUrl?: string;
  role: 'admin' | 'pharmacy';
  actorType: AdminAuditActorType;
  status: 'new' | 'active' | 'blocked';
}>;

export type AdminAuditActorsResponseDto = Readonly<{
  items: readonly AdminAuditActorDto[];
}>;

export type AdminAuditListItemDto = Readonly<{
  id: string;
  actorUserId: string;
  actorNameSnapshot: string;
  action: AdminAuditAction;
  section: AdminAuditSection;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabelSnapshot: string;
  scopeEntityType?: AdminAuditEntityType;
  scopeEntityId?: string;
  changedFields: string[];
  statusBefore?: string;
  statusAfter?: string;
  reason?: string;
  requestId: string;
  createdAt: string;
}>;

export type AdminAuditListResponseDto = Readonly<{
  items: readonly AdminAuditListItemDto[];
  page: number;
  perPage: 20 | 50 | 100;
  total: number;
  totalPages: number;
  earliestCreatedAt: string | null;
  availableActions: readonly AdminAuditAction[];
}>;

export type AdminAuditDetailsDto = AdminAuditListItemDto &
  Readonly<{
    before: Record<string, AdminAuditValue>;
    after: Record<string, AdminAuditValue>;
  }>;
