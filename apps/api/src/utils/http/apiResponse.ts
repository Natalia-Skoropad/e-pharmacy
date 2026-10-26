import type { Response } from 'express';

//===============================================================

type ApiSuccessResponse<TData> = {
  status: 'success';
  message?: string;
  data: TData;
};

type ApiEmptySuccessResponse = {
  status: 'success';
  message?: string;
};

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
  const responseBody: ApiSuccessResponse<TData> | ApiEmptySuccessResponse =
    data === undefined
      ? {
          status: 'success',
          ...(message ? { message } : {}),
        }
      : {
          status: 'success',
          ...(message ? { message } : {}),
          data,
        };

  res.status(statusCode).json(responseBody);
}
