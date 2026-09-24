import { z } from 'zod';

import {
  sharedEmailSchema,
  sharedExpectedRevisionSchema,
  sharedPictureUrlSchema,
  sharedUserNameSchema,
} from './shared-validation.schema';

import { hasMeaningfulValue } from './shared/meaningful-value';

//===============================================================

export const updateMyAdminEmployeeProfileSchema = z
  .object({
    name: sharedUserNameSchema.optional(),
    email: sharedEmailSchema.optional(),
    pictureUrl: sharedPictureUrlSchema,
    expectedRevision: sharedExpectedRevisionSchema,
  })
  .refine(
    (data) =>
      Object.entries(data).some(
        ([key, value]) =>
          key !== 'expectedRevision' && hasMeaningfulValue(value)
      ),
    { message: 'At least one profile field must be provided.' }
  );

//===============================================================

export type UpdateMyAdminEmployeeProfileInput = z.infer<
  typeof updateMyAdminEmployeeProfileSchema
>;
