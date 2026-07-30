import type { RequestOptions } from '@e-pharmacy/api-client/transport';

//===================================================================

export type ApiReaderRequester<TOptions extends RequestOptions> = (
  path: string,
  options?: TOptions
) => Promise<unknown>;
