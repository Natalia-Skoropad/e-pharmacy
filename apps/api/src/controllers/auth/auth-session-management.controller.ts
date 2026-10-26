import type { Request, Response } from 'express';

import { AUTH_ERROR_CODES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import {
  getActiveSessionsService,
  revokeUserSessionService,
} from '../../services/auth/auth-sessions.service';

import { sendSuccessResponse } from '../../utils/http/apiResponse';
import { httpError } from '../../utils/http/httpError';

//===============================================================

// Domain controller handlers; imported directly by routes.

export async function getActiveSessions(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) return;

  const data = await getActiveSessionsService(userId, req.authSessionId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function revokeActiveSession(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) return;

  const sessionId = String(req.params.sessionId ?? '');

  if (req.authSessionId && sessionId === req.authSessionId) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Use the logout endpoint to revoke the current session.',
      undefined,

      AUTH_ERROR_CODES.VALIDATION_FAILED
    );
  }

  await revokeUserSessionService(userId, sessionId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Session was revoked successfully.',
  });
}
