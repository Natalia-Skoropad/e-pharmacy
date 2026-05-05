import type { Response } from 'express';

//===============================================================

type SuccessResponseOptions<TData> = {
  res: Response;
  statusCode: number;
  data?: TData;
  message?: string;
};

//===============================================================

export function sendSuccessResponse<TData>({
  res,
  statusCode,
  data,
  message,
}: SuccessResponseOptions<TData>): void {
  res.status(statusCode).json({
    status: 'success',
    ...(message ? { message } : {}),
    ...(data ? { data } : {}),
  });
}
