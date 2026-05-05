import type { Request, Response } from 'express';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { sendSuccessResponse } from '../utils/apiResponse';

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

export function echoHealth(req: Request, res: Response): void {
  const { message } = req.body as { message: string };

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: {
      message,
    },
  });
}
