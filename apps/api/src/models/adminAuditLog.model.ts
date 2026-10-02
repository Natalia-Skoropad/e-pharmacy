import { Schema, model, models } from 'mongoose';

import {
  ADMIN_AUDIT_ACTION_VALUES,
  ADMIN_AUDIT_ENTITY_TYPE_VALUES,
  ADMIN_AUDIT_LIMITS,
  ADMIN_AUDIT_SECTION_VALUES,
} from '../constants/admin-audit';

import type { AdminAuditLogEntity } from '../types/admin-audit';

//===============================================================

const adminAuditLogSchema = new Schema<AdminAuditLogEntity>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    actorNameSnapshot: {
      type: String,
      required: true,
      trim: true,
      maxlength: ADMIN_AUDIT_LIMITS.actorName,
    },

    action: {
      type: String,
      enum: ADMIN_AUDIT_ACTION_VALUES,
      required: true,
      index: true,
    },

    section: {
      type: String,
      enum: ADMIN_AUDIT_SECTION_VALUES,
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      enum: ADMIN_AUDIT_ENTITY_TYPE_VALUES,
      required: true,
      index: true,
    },

    entityId: {
      type: String,
      required: true,
      trim: true,
      maxlength: ADMIN_AUDIT_LIMITS.entityId,
    },

    entityLabelSnapshot: {
      type: String,
      required: true,
      trim: true,
      maxlength: ADMIN_AUDIT_LIMITS.entityLabel,
    },

    scopeEntityType: {
      type: String,
      enum: ADMIN_AUDIT_ENTITY_TYPE_VALUES,
      default: undefined,
      index: true,
    },

    scopeEntityId: {
      type: String,
      trim: true,
      maxlength: ADMIN_AUDIT_LIMITS.entityId,
      default: undefined,
    },

    before: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },

    after: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },

    changedFields: {
      type: [String],
      required: true,
      default: [],
    },

    reason: {
      type: String,
      trim: true,
      maxlength: ADMIN_AUDIT_LIMITS.reason,
      default: undefined,
    },

    requestId: {
      type: String,
      required: true,
      trim: true,
      maxlength: ADMIN_AUDIT_LIMITS.requestId,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

//===============================================================

adminAuditLogSchema.index({ createdAt: -1, _id: -1 });
adminAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

adminAuditLogSchema.index({
  scopeEntityType: 1,
  scopeEntityId: 1,
  createdAt: -1,
  _id: -1,
});

adminAuditLogSchema.index({ actorUserId: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ section: 1, createdAt: -1 });

//===============================================================

export const AdminAuditLog =
  models.AdminAuditLog ||
  model<AdminAuditLogEntity>('AdminAuditLog', adminAuditLogSchema);
