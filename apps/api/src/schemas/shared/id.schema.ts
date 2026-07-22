import { z } from 'zod';

//===================================================================

export const MONGO_ID_PATTERN = /^[a-f\d]{24}$/i;
export const MONGO_ID_MESSAGE = 'ID must be valid';

//===================================================================

export const mongoIdSchema = z
  .string()
  .trim()
  .regex(MONGO_ID_PATTERN, MONGO_ID_MESSAGE);
