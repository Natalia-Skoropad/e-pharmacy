import { z } from 'zod';

import {
  sharedEmailSchema,
  sharedOptionalAddressSchema,
  sharedPasswordSchema,
  sharedRequiredPhoneSchema,
  sharedUserNameSchema,
} from './shared-validation.schema';

//===============================================================

export const adminOwnerBootstrapSchema = z.object({
  name: sharedUserNameSchema,
  email: sharedEmailSchema,
  password: sharedPasswordSchema,
  phone: sharedRequiredPhoneSchema,
  address: sharedOptionalAddressSchema,
});

export type AdminOwnerBootstrapInput = z.infer<
  typeof adminOwnerBootstrapSchema
>;
