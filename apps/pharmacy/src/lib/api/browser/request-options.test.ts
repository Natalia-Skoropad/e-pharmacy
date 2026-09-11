import assert from 'node:assert/strict';
import test from 'node:test';

import {
  sanitizeBrowserReadRequestOptions,
  type BrowserReadRequestOptions,
} from './request-options';

//===================================================================

test('read request options forward only cancellation and timeout controls', () => {
  const controller = new AbortController();
  const unsafeCallerOptions = {
    signal: controller.signal,
    timeoutMs: 2_500,
    method: 'POST',
    cache: 'force-cache',
    credentials: 'omit',
    redirect: 'follow',
    retry: { attempts: 5 },
    headers: { authorization: 'Bearer unexpected' },
    body: { unexpected: true },
  } as unknown as BrowserReadRequestOptions;

  assert.deepEqual(sanitizeBrowserReadRequestOptions(unsafeCallerOptions), {
    signal: controller.signal,
    timeoutMs: 2_500,
  });
});

//===================================================================

test('read request options preserve AbortSignal identity and optional timeout', () => {
  const controller = new AbortController();

  const sanitized = sanitizeBrowserReadRequestOptions({
    signal: controller.signal,
  });

  assert.equal(sanitized?.signal, controller.signal);
  assert.equal('timeoutMs' in (sanitized ?? {}), false);
  assert.equal(sanitizeBrowserReadRequestOptions(), undefined);
});
