import { Schema, model, models } from 'mongoose';

import {
  SETTINGS_DICTIONARY_NAME_MAX_LENGTH,
  SETTINGS_DICTIONARY_NAME_PATTERN,
  normalizeSettingsDictionaryName,
  normalizeSettingsDictionaryNameKey,
} from '../constants/settings-dictionary';

import type { PositionPersistenceEntity } from '../types/position';

//===============================================================

const positionSchema = new Schema<PositionPersistenceEntity>(
  {
    name: {
      type: String,
      required: [true, 'Position name is required'],
      trim: true,
      maxlength: [
        SETTINGS_DICTIONARY_NAME_MAX_LENGTH,
        `Position name must be at most ${SETTINGS_DICTIONARY_NAME_MAX_LENGTH} characters`,
      ],
      match: [
        SETTINGS_DICTIONARY_NAME_PATTERN,
        'Use Latin letters and spaces, starting with an uppercase letter',
      ],
    },

    normalizedName: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

//===============================================================

positionSchema.pre('validate', function normalizePositionIdentity() {
  if (typeof this.name === 'string') {
    this.name = normalizeSettingsDictionaryName(this.name);
    this.normalizedName = normalizeSettingsDictionaryNameKey(this.name);
  }
});

//===============================================================

positionSchema.index(
  { normalizedName: 1 },
  { unique: true, name: 'position_normalized_name_unique' }
);

positionSchema.index({ createdAt: -1, _id: -1 });

//===============================================================

export const Position =
  models.Position ||
  model<PositionPersistenceEntity>('Position', positionSchema);
