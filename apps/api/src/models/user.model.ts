import { Schema, model, models } from 'mongoose';

import {
  USER_NAME_MAX_LENGTH,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';
import type { UserEntity } from '../types/user';

//===============================================================

const userSchema = new Schema<UserEntity>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [
        USER_NAME_MAX_LENGTH,
        `Name must be at most ${USER_NAME_MAX_LENGTH} characters`,
      ],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
      default: undefined,
    },

    avatarUrl: {
      type: String,
      trim: true,
      default: undefined,
    },

    favoriteProductIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

export const User = models.User || model<UserEntity>('User', userSchema);
