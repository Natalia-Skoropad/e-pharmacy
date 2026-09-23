import { Schema, model, models } from 'mongoose';

import { ADMIN_ACCESS_STATUSES } from '../constants/admin-access';

import {
  ADMIN_PERMISSION_VALUES,
  normalizeAdminPermissions,
} from '../constants/admin-permissions';

import type { AdminAccessEntity } from '../types/admin-access';

//===============================================================

const adminAccessSchema = new Schema<AdminAccessEntity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(ADMIN_ACCESS_STATUSES),
      default: ADMIN_ACCESS_STATUSES.ACTIVE,
      required: true,
      index: true,
    },

    isPlatformOwner: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },

    permissions: {
      type: [String],
      enum: ADMIN_PERMISSION_VALUES,
      default: [],
      required: true,
      set: (values: unknown[]) => normalizeAdminPermissions(values),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

adminAccessSchema.index({ status: 1, isPlatformOwner: 1 });

//===============================================================

export const AdminAccess =
  models.AdminAccess ||
  model<AdminAccessEntity>('AdminAccess', adminAccessSchema);
