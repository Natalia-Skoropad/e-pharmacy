import { z } from 'zod';

//===============================================================

export const healthEchoSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(100, 'Message must be at most 100 characters'),
});
