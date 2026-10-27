import { z } from 'zod';

import {
  createPerPageSchema,
  mongoIdSchema,
  normalizePaginationQuery,
  positivePageSchema,
} from '../shared/index';

import { sharedSearchSchema } from '../shared/shared-validation.schema';

//===============================================================

// Dedicated bounded public combobox query; legacy /options and /filters
// remain unchanged for existing API consumers.
export const pharmacySearchOptionsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z
    .object({
      kind: z.enum(['pharmacy', 'location']),
      page: positivePageSchema,
      perPage: createPerPageSchema({ defaultValue: 50, max: 50 }),
      query: sharedSearchSchema,
      pharmacyId: mongoIdSchema.optional(),
      settlement: sharedSearchSchema,
      region: sharedSearchSchema,
      selectedId: mongoIdSchema.optional(),
    })
    .strict()
);

//===============================================================

export type PharmacySearchOptionsQuery = z.infer<
  typeof pharmacySearchOptionsQuerySchema
>;
