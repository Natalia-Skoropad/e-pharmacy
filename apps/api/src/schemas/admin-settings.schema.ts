import { z } from 'zod';

import {
  SETTINGS_DICTIONARY_NAME_MAX_LENGTH,
  SETTINGS_DICTIONARY_NAME_PATTERN,
} from '../constants/settings-dictionary';

import {
  createPerPageSchema,
  mongoIdSchema,
  normalizePaginationQuery,
  positivePageSchema,
} from './shared';

import {
  DATE_RANGE_MESSAGE,
  dateQuerySchema,
  isDateRangeOrdered,
} from './shared/date.schema';

import { sharedSearchSchema } from './shared-validation.schema';

//===============================================================

export const settingsDictionaryNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')

  .max(
    SETTINGS_DICTIONARY_NAME_MAX_LENGTH,
    `Name must be at most ${SETTINGS_DICTIONARY_NAME_MAX_LENGTH} characters`
  )

  .regex(
    SETTINGS_DICTIONARY_NAME_PATTERN,
    'Use Latin letters and spaces, starting with an uppercase letter'
  );

//===============================================================

const settingsDictionaryPerPageSchema = createPerPageSchema({
  defaultValue: 20,
  max: 100,
});

//===============================================================

export const adminSettingsDictionaryListQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      page: positivePageSchema,
      perPage: settingsDictionaryPerPageSchema,
      keyword: sharedSearchSchema,
      createdFrom: dateQuerySchema,
      createdTo: dateQuerySchema,
    })
    .strict()
    .refine(
      ({ createdFrom, createdTo }) =>
        isDateRangeOrdered(createdFrom, createdTo),
      { message: DATE_RANGE_MESSAGE, path: ['createdTo'] }
    )
);

//===============================================================

export const createAdminSettingsDictionaryItemSchema = z
  .object({ name: settingsDictionaryNameSchema })
  .strict();

export const updateAdminSettingsDictionaryItemSchema =
  createAdminSettingsDictionaryItemSchema;

//===============================================================

export const adminProductCategoryParamsSchema = z.object({
  categoryId: mongoIdSchema,
});

export const adminPositionParamsSchema = z.object({
  positionId: mongoIdSchema,
});

//===============================================================

export type AdminSettingsDictionaryListQuery = z.infer<
  typeof adminSettingsDictionaryListQuerySchema
>;

export type CreateAdminSettingsDictionaryItemInput = z.infer<
  typeof createAdminSettingsDictionaryItemSchema
>;

export type UpdateAdminSettingsDictionaryItemInput = z.infer<
  typeof updateAdminSettingsDictionaryItemSchema
>;

export type AdminProductCategoryParams = z.infer<
  typeof adminProductCategoryParamsSchema
>;

export type AdminPositionParams = z.infer<typeof adminPositionParamsSchema>;
