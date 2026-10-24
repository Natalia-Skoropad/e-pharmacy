import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { API_MESSAGES } from '../../constants/shared/messages';

//===============================================================

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    status: 'error',
    message: API_MESSAGES.ROUTE_NOT_FOUND,
    path: req.originalUrl,

    ...(res.locals.requestId ? { requestId: res.locals.requestId } : {}),
  });
}
