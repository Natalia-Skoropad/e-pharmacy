import type { z } from 'zod';

import type { loginSchema, registerSchema } from '../schemas/auth.schema';

//===============================================================

export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
