import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { httpError } from '../../utils/http/httpError';

//===============================================================

// The selected pharmacy is request-local: never retain selection on a User,
// Session or process-wide variable (a user can belong to several pharmacies).
const selection = new AsyncLocalStorage<string | undefined>();

export const PHARMACY_SELECTION_HEADER = 'X-Pharmacy-ID';

//===============================================================

export function getSelectedPharmacyId(): string | undefined {
  return selection.getStore();
}

//===============================================================

export function attachPharmacySelection(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const value = req.get(PHARMACY_SELECTION_HEADER)?.trim();

  if (value && !Types.ObjectId.isValid(value)) {
    next(httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid pharmacy id.'));

    return;
  }

  selection.run(value?.toLowerCase() || undefined, next);
}
