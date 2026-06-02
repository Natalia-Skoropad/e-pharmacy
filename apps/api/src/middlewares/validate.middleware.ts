import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

import { HTTP_STATUS } from '../constants/httpStatus';
import { API_MESSAGES } from '../constants/messages';
import type { ValidationErrorDetails } from '../types/errors';
import { httpError } from '../utils/httpError';

//===============================================================

type ValidateSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

//===============================================================

function getValidationErrorDetails(
  error: unknown
): ValidationErrorDetails | undefined {
  if (!(error instanceof ZodError)) {
    return undefined;
  }

  return error.issues.reduce<ValidationErrorDetails>((acc, issue) => {
    const field = issue.path.length > 0 ? issue.path.join('.') : 'root';

    acc[field] = [...(acc[field] ?? []), issue.message];

    return acc;
  }, {});
}

//===============================================================

export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      if (schemas.query) {
        // Express 5 exposes req.query as a getter-only property. Assigning to it
        // throws a TypeError, which was converted to a 400 response by this
        // middleware. We only validate query params here; controllers parse the
        // original req.query again before passing typed values to services.
        schemas.query.parse(req.query);
      }

      next();
    } catch (error) {
      next(
        httpError(
          HTTP_STATUS.BAD_REQUEST,
          API_MESSAGES.VALIDATION_ERROR,
          getValidationErrorDetails(error)
        )
      );
    }
  };
}
