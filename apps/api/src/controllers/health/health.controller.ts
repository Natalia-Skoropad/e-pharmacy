import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { API_MESSAGES } from '../../constants/shared/messages';

import type { HealthEchoInput } from '../../schemas/infrastructure/health.schema';
import type { ValidatedResponse } from '../../types/http/validated-request';

import { sendSuccessResponse } from '../../utils/apiResponse';

//===============================================================

export function getHealth(_req: Request, res: Response): void {
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: API_MESSAGES.HEALTH_OK,

    data: {
      status: 'ok',
    },
  });
}

//===============================================================

export function echoHealth(
  _req: Request,
  res: ValidatedResponse<HealthEchoInput>
): void {
  const { message } = res.locals.validated.body;

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,

    data: {
      message,
    },
  });
}
