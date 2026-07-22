import { Schema, model, models } from 'mongoose';

import {
  ADDRESS_PATTERN,
  EMAIL_PATTERN,
  PHONE_PATTERN,
  PICTURE_DATA_URL_MAX_LENGTH,
  PICTURE_HTTP_URL_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  USER_ADDRESS_MIN_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
  USER_NAME_PATTERN,
  USER_PHONE_MAX_LENGTH,
  USER_PHONE_MIN_LENGTH,
  VALIDATION_MESSAGES,
  isHttpUrl,
  isPictureDataUrl,
} from '../constants/validation';

import {
  AUTH_APPLICATIONS,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

import type { UserEntity } from '../types/user';

//===============================================================

const userSchema = new Schema<UserEntity>(
  {
    name: {
      type: String,
      required: [true, VALIDATION_MESSAGES.required.name],
      trim: true,
      minlength: [USER_NAME_MIN_LENGTH, VALIDATION_MESSAGES.limits.nameMin],
      maxlength: [USER_NAME_MAX_LENGTH, VALIDATION_MESSAGES.limits.nameMax],
      match: [USER_NAME_PATTERN, VALIDATION_MESSAGES.format.name],
    },

    email: {
      type: String,
      required: [true, VALIDATION_MESSAGES.required.email],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [USER_EMAIL_MAX_LENGTH, VALIDATION_MESSAGES.limits.emailMax],
      match: [EMAIL_PATTERN, VALIDATION_MESSAGES.format.emailApi],
    },

    password: {
      type: String,
      required: [true, VALIDATION_MESSAGES.required.password],
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CLIENT,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
      required: true,
    },

    statusReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },

    phone: {
      type: String,
      required: [true, VALIDATION_MESSAGES.required.phone],
      unique: true,
      trim: true,
      minlength: [USER_PHONE_MIN_LENGTH, VALIDATION_MESSAGES.limits.phoneMin],
      maxlength: [USER_PHONE_MAX_LENGTH, VALIDATION_MESSAGES.limits.phoneMax],
      match: [PHONE_PATTERN, VALIDATION_MESSAGES.format.phone],
    },

    address: {
      type: String,
      trim: true,
      minlength: [
        USER_ADDRESS_MIN_LENGTH,
        VALIDATION_MESSAGES.limits.addressMin,
      ],
      maxlength: [
        USER_ADDRESS_MAX_LENGTH,
        VALIDATION_MESSAGES.limits.addressMax,
      ],
      match: [ADDRESS_PATTERN, VALIDATION_MESSAGES.format.address],
      default: undefined,
    },

    pictureUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (value?: string) => {
          if (!value) return true;
          if (isPictureDataUrl(value)) {
            return value.length <= PICTURE_DATA_URL_MAX_LENGTH;
          }
          if (isHttpUrl(value)) {
            return value.length <= PICTURE_HTTP_URL_MAX_LENGTH;
          }
          return false;
        },
        message: VALIDATION_MESSAGES.format.picture,
      },
      default: undefined,
    },

    resetPasswordTokenHash: {
      type: String,
      select: false,
      default: undefined,
    },

    resetPasswordExpiresAt: {
      type: Date,
      select: false,
      default: undefined,
    },

    resetPasswordApplication: {
      type: String,
      enum: Object.values(AUTH_APPLICATIONS),
      select: false,
      default: undefined,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },

    approvedAt: {
      type: Date,
      default: undefined,
    },

    isDefaultPharmacyClient: {
      type: Boolean,
      default: false,
      index: true,
    },

    defaultClientPharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
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

userSchema.index({ role: 1, status: 1 });
userSchema.index({ approvedBy: 1 });

userSchema.index(
  { defaultClientPharmacyId: 1, isDefaultPharmacyClient: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefaultPharmacyClient: true },
  }
);

//===============================================================

export const User = models.User || model<UserEntity>('User', userSchema);
