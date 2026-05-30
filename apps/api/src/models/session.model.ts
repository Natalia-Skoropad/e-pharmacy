import { Schema, model, models } from 'mongoose';

import { USER_ROLES } from '../constants/auth';
import type { SessionEntity } from '../types/session';

//===============================================================

const sessionSchema = new Schema<SessionEntity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent must be at most 500 characters'],
      default: undefined,
    },

    ip: {
      type: String,
      trim: true,
      maxlength: [80, 'IP must be at most 80 characters'],
      default: undefined,
    },

    deviceName: {
      type: String,
      trim: true,
      maxlength: [120, 'Device name must be at most 120 characters'],
      default: undefined,
    },

    roleAtLogin: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    lastUsedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    revokedAt: {
      type: Date,
      default: undefined,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

sessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });
sessionSchema.index({ refreshTokenHash: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

//===============================================================

export const Session = models.Session || model<SessionEntity>('Session', sessionSchema);
