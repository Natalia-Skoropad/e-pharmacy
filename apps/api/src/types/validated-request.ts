import type { Response } from 'express';

//===================================================================

export type ValidatedRequestData<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
> = Readonly<{
  body: TBody;
  params: TParams;
  query: TQuery;
}>;

export type ValidatedResponse<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
> = Response<
  unknown,
  { validated: ValidatedRequestData<TBody, TParams, TQuery> }
>;
