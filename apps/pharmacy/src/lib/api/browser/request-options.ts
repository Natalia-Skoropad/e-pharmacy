import type { JsonResponseRequestOptions } from '@e-pharmacy/api-client/transport';

//===================================================================

export type BrowserReadRequestOptions = Readonly<
  Pick<JsonResponseRequestOptions, 'signal' | 'timeoutMs'>
>;

//===================================================================

export function sanitizeBrowserReadRequestOptions(
  options?: BrowserReadRequestOptions
): BrowserReadRequestOptions | undefined {
  if (!options) return undefined;

  return {
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.timeoutMs !== undefined
      ? { timeoutMs: options.timeoutMs }
      : {}),
  };
}
