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
        schemas.body.parse(req.body);
      }

      if (schemas.params) {
        schemas.params.parse(req.params);
      }

      if (schemas.query) {
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
