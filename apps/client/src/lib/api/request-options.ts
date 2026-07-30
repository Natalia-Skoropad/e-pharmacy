import type {
  JsonResponseRequestOptions,
  RequestOptions,
} from '@e-pharmacy/api-client/transport';

//===================================================================

export type ReadRequestOptions = Omit<
  JsonResponseRequestOptions,
  'method' | 'body'
>;

export type MutationRequestOptions = Omit<
  JsonResponseRequestOptions,
  'method' | 'body'
>;

export type PublicReadRequestOptions<TOptions extends RequestOptions> = Omit<
  TOptions,
  'method' | 'body'
>;
