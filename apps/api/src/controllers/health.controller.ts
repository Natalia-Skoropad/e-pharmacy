import type { Request, Response } from 'express';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

//===============================================================

export function getHealth(_req: Request, res: Response): void {
  res.status(HTTP_STATUS.OK).json({
    status: 'ok',
    message: API_MESSAGES.HEALTH_OK,
  });
}

//===============================================================

export function echoHealth(req: Request, res: Response): void {
  const { message } = req.body as { message: string };

  res.status(HTTP_STATUS.OK).json({
    status: 'ok',
    message,
  });
}
