import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { formatZodError } from '../utils/formatZodError';
import { httpError } from '../utils/httpError';

//===============================================================

type ValidationSchemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

//===============================================================

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const bodyResult = schemas.body?.safeParse(req.body);
    const paramsResult = schemas.params?.safeParse(req.params);
    const queryResult = schemas.query?.safeParse(req.query);

    const errors = [bodyResult, paramsResult, queryResult].filter(
      (result) => result && !result.success
    );

    if (errors.length > 0) {
      const details = errors.reduce((acc, result) => {
        if (!result || result.success) return acc;

        return {
          ...acc,
          ...formatZodError(result.error),
        };
      }, {});

      next(
        httpError(
          HTTP_STATUS.BAD_REQUEST,
          API_MESSAGES.VALIDATION_ERROR,
          details
        )
      );

      return;
    }

    if (bodyResult?.success) {
      req.body = bodyResult.data;
    }

    if (paramsResult?.success) {
      req.params = paramsResult.data as Request['params'];
    }

    if (queryResult?.success) {
      req.query = queryResult.data as Request['query'];
    }

    next();
  };
}
