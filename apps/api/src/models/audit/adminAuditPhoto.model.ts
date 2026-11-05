import { Schema, Types, model, models } from 'mongoose';

import { ADMIN_AUDIT_RETENTION_SECONDS } from '../../constants/admin/audit/admin-audit';

//===================================================================

// Historical pharmacy photos live apart from the immutable, metadata-only
// audit snapshots. They are never accessible through public pharmacy routes.
type AdminAuditPhotoEntity = {
  auditLogId: Types.ObjectId;
  side: 'before' | 'after';
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  content: Buffer;
  createdAt: Date;
};

//===================================================================

const schema = new Schema<AdminAuditPhotoEntity>(
  {
    auditLogId: {
      type: Schema.Types.ObjectId,
      ref: 'AdminAuditLog',
      required: true,
    },

    side: { type: String, enum: ['before', 'after'], required: true },

    mimeType: {
      type: String,
      enum: ['image/jpeg', 'image/png', 'image/webp'],
      required: true,
    },

    content: { type: Buffer, required: true },
    createdAt: { type: Date, default: Date.now, required: true },
  },

  { versionKey: false }
);

//===================================================================

schema.index({ auditLogId: 1, side: 1 }, { unique: true });

schema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: ADMIN_AUDIT_RETENTION_SECONDS,
    name: 'admin_audit_photo_retention_ttl',
  }
);

//===================================================================

export const AdminAuditPhoto =
  models.AdminAuditPhoto ||
  model<AdminAuditPhotoEntity>('AdminAuditPhoto', schema);
