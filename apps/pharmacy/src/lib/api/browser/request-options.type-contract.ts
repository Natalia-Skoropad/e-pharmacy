import type { BrowserReadRequestOptions } from './request-options';

//===================================================================

const allowedOptions: BrowserReadRequestOptions = {
  signal: new AbortController().signal,
  timeoutMs: 5_000,
};
void allowedOptions;

//===================================================================

const methodOverride: BrowserReadRequestOptions = {
  // @ts-expect-error Method ownership belongs to the browser API adapter.
  method: 'POST',
};
void methodOverride;

//===================================================================

const cacheOverride: BrowserReadRequestOptions = {
  // @ts-expect-error Cache ownership belongs to the same-origin transport.
  cache: 'force-cache',
};
void cacheOverride;

//===================================================================

const credentialsOverride: BrowserReadRequestOptions = {
  // @ts-expect-error Credentials ownership belongs to the same-origin transport.
  credentials: 'omit',
};
void credentialsOverride;
