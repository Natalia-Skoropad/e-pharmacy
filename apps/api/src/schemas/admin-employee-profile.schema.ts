import { z } from 'zod';

import {
  sharedExpectedRevisionSchema,
  sharedPictureUrlSchema,
} from './shared-validation.schema';

import { hasMeaningfulValue } from './shared/meaningful-value';

//===============================================================

export const updateMyAdminEmployeeProfileSchema = z
  .object({
    pictureUrl: sharedPictureUrlSchema,
    expectedRevision: sharedExpectedRevisionSchema,
  })

  .strict()

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
