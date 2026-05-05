import type { z } from 'zod';

import type { ValidationErrorDetails } from '../types/errors';

//===============================================================

export function formatZodError(error: z.ZodError): ValidationErrorDetails {
  return error.issues.reduce<ValidationErrorDetails>((acc, issue) => {
    const path = issue.path.join('.') || 'root';

    if (!acc[path]) {
      acc[path] = [];
    }

    acc[path].push(issue.message);

    return acc;
  }, {});
}
