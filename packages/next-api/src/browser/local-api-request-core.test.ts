import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import { localApiRequest } from './local-api-request-core.ts';

//===================================================================

const originalFetch = globalThis.fetch;

//===================================================================

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

//===================================================================

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

//===================================================================

test('returns JSON and requires an explicit empty-response contract for 204', async () => {
  try {
    globalThis.fetch = async () => jsonResponse({ ok: true });
    assert.deepEqual(await localApiRequest('/api/example'), { ok: true });

    globalThis.fetch = async () => new Response(null, { status: 204 });

    await assert.rejects(
      localApiRequest('/api/example'),
      (error: unknown) =>
        error instanceof ApiError && error.code === 'INVALID_RESPONSE'
    );

    globalThis.fetch = async () => new Response(null, { status: 204 });

    assert.equal(
      await localApiRequest('/api/example', { responseType: 'no-content' }),
      undefined
    );
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('rejects invalid JSON and HTML success responses', async () => {
  try {
    for (const response of [
      new Response('{', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),

      new Response('<html></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    ]) {
      globalThis.fetch = async () => response.clone();

      await assert.rejects(
        localApiRequest('/api/example'),
        (error: unknown) =>
          error instanceof ApiError && error.code === 'INVALID_RESPONSE'
      );
    }
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('supports structured +json responses through the shared parser', async () => {
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ status: 'success', data: null }), {
        status: 200,
        headers: {
          'content-type': 'application/problem+json; charset=utf-8',
        },
      });

    assert.deepEqual(await localApiRequest('/api/problem-json'), {
      status: 'success',
      data: null,
    });
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('classifies timeout and caller abort separately', async () => {
  const abortingFetch = async (
    _input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> =>
    new Promise((_resolve, reject) => {
      const signal = init?.signal;

      if (!signal) {
        reject(new Error('Expected the request to include an AbortSignal.'));
        return;
      }

      const failSafeTimer = setTimeout(() => {
        reject(new Error('The mocked fetch request was not aborted.'));
      }, 1_000);

      const rejectWithAbortReason = (): void => {
        clearTimeout(failSafeTimer);
        reject(signal.reason);
      };

      if (signal.aborted) {
        rejectWithAbortReason();
        return;
      }

      signal.addEventListener('abort', rejectWithAbortReason, { once: true });
    });

  try {
    globalThis.fetch = abortingFetch;

    await assert.rejects(
      localApiRequest('/api/timeout', { timeoutMs: 5, retry: false }),
      (error: unknown) => error instanceof ApiError && error.code === 'TIMEOUT'
    );

    const inactiveController = new AbortController();

    await assert.rejects(
      localApiRequest('/api/combined-timeout', {
        signal: inactiveController.signal,
        timeoutMs: 5,
        retry: false,
      }),
      (error: unknown) => error instanceof ApiError && error.code === 'TIMEOUT'
    );

    const controller = new AbortController();

    const request = localApiRequest('/api/abort', {
      signal: controller.signal,
      timeoutMs: 10_000,
    });

    controller.abort();

    await assert.rejects(
      request,
      (error: unknown) => error instanceof ApiError && error.code === 'ABORTED'
    );
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('retries GET status and network failures but never retries mutations', async () => {
  try {
    let statusCalls = 0;
    globalThis.fetch = async () => {
      statusCalls += 1;
      return statusCalls === 1
        ? jsonResponse({ error: true }, 503)
        : jsonResponse({ ok: true });
    };

    const controller = new AbortController();

    assert.deepEqual(
      await localApiRequest('/api/retry-status', {
        signal: controller.signal,
        retry: { attempts: 2, delayMs: 0 },
      }),
      { ok: true }
    );

    assert.equal(statusCalls, 2);

    let networkCalls = 0;
    globalThis.fetch = async () => {
      networkCalls += 1;
      if (networkCalls === 1) throw new TypeError('network');
      return jsonResponse({ ok: true });
    };

    await localApiRequest('/api/retry-network', {
      retry: { attempts: 2, delayMs: 0 },
    });

    assert.equal(networkCalls, 2);

    let mutationCalls = 0;
    globalThis.fetch = async () => {
      mutationCalls += 1;
      throw new TypeError('network');
    };

    await assert.rejects(
      localApiRequest('/api/mutation', {
        method: 'POST',
        body: { value: 1 },
        retry: { attempts: 3, delayMs: 0 },
      })
    );
    assert.equal(mutationCalls, 1);
  } finally {
    restoreFetch();
  }
});
