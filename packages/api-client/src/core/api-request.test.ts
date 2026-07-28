import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from './api-error';
import { apiRequest, createApiClient } from './api-request';

import {
  InvalidApiBaseUrlError,
  InvalidApiPathError,
  createApiUrl,
} from './api-url';

//===================================================================

const originalFetch = globalThis.fetch;

const requestOptions = {
  baseUrl: 'https://api.example',
  retry: false as const,
};

//===================================================================

function jsonResponse(
  payload: unknown,
  status = 200,
  contentType = 'application/json'
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': contentType },
  });
}

//===================================================================

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

//===================================================================

test('requires configured requests at compile time and supports a configured factory', async () => {
  if (false) {
    // @ts-expect-error apiRequest requires a baseUrl-bearing options object.
    await apiRequest('/products');
  }

  await assert.rejects(
    (apiRequest as unknown as (path: string) => Promise<unknown>)('/products'),
    InvalidApiBaseUrlError
  );

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), 'https://api.example/v1/products');
      assert.equal(init?.redirect, 'manual');
      return jsonResponse({ status: 'success', data: [] });
    };

    const client = createApiClient({
      baseUrl: 'https://api.example/v1',
      defaults: { retry: false, redirect: 'manual' },
    });

    assert.deepEqual(await client.request('/products'), {
      status: 'success',
      data: [],
    });
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('validates base URLs and preserves their pathname', () => {
  assert.equal(
    createApiUrl('/products?page=2', 'https://api.example/v1'),
    'https://api.example/v1/products?page=2'
  );
  assert.equal(
    createApiUrl('/products?page=2', 'https://api.example/v1/'),
    'https://api.example/v1/products?page=2'
  );

  for (const baseUrl of [
    '',
    'not a url',
    'ftp://api.example',
    'https://user:pass@api.example',
    'https://api.example?debug=1',
    'https://api.example#fragment',
  ]) {
    assert.throws(
      () => createApiUrl('/products', baseUrl),
      InvalidApiBaseUrlError
    );
  }
});

//===================================================================

test('rejects unsafe API paths including fragments', async () => {
  for (const path of [
    'https://external.example/resource',
    '//external.example/resource',
    '/products/../admin',
    '/products/%2e%2e/admin',
    '/products/%ZZ',
    '/products#details',
  ]) {
    await assert.rejects(
      apiRequest(path, requestOptions),
      (error: unknown) => error instanceof InvalidApiPathError
    );
  }
});

//===================================================================

test('supports JSON media types including structured +json and valid null', async () => {
  try {
    for (const contentType of [
      'application/json',
      'Application/JSON; charset=utf-8',
      'application/problem+json; charset=utf-8',
      'application/vnd.api+json',
      'application/hal+json',
    ]) {
      globalThis.fetch = async () => jsonResponse(null, 200, contentType);
      assert.equal(await apiRequest('/resource', requestOptions), null);
    }
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('distinguishes non-JSON and malformed JSON responses', async () => {
  try {
    const responses = [
      new Response('<html></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
      new Response('{', {
        status: 200,
        headers: { 'content-type': 'application/problem+json' },
      }),
    ];

    for (const response of responses) {
      globalThis.fetch = async () => response.clone();
      await assert.rejects(
        apiRequest('/resource', requestOptions),
        (error: unknown) =>
          error instanceof ApiError &&
          error.transportCode === 'INVALID_RESPONSE' &&
          error.httpStatus === 200
      );
    }
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('separates strict no-content from JSON success envelopes', async () => {
  try {
    globalThis.fetch = async () => new Response(null, { status: 204 });

    await assert.rejects(
      apiRequest('/resource', requestOptions),
      (error: unknown) =>
        error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
    );

    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(
      await apiRequest('/resource', {
        ...requestOptions,
        responseType: 'no-content',
      }),
      undefined
    );

    globalThis.fetch = async () =>
      new Response('<html></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });

    await assert.rejects(
      apiRequest('/resource', {
        ...requestOptions,
        responseType: 'no-content',
      }),
      (error: unknown) =>
        error instanceof ApiError && error.transportCode === 'INVALID_RESPONSE'
    );
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('separates backend error semantics from transport errors', async () => {
  try {
    globalThis.fetch = async () =>
      jsonResponse(
        {
          status: 'error',
          message: 'Article already exists',
          code: 'ARTICLE_EXISTS',
          requestId: 'request-123',
          details: { field: 'article' },
        },
        409,
        'application/problem+json'
      );

    await assert.rejects(
      apiRequest('/resource', requestOptions),
      (error: unknown) =>
        error instanceof ApiError &&
        error.transportCode === undefined &&
        error.httpStatus === 409 &&
        error.backendCode === 'ARTICLE_EXISTS' &&
        error.requestId === 'request-123' &&
        error.details !== undefined
    );
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('retries the default GET status allowlist and network failures', async () => {
  try {
    for (const status of [502, 503, 504]) {
      let calls = 0;
      globalThis.fetch = async () => {
        calls += 1;
        return calls === 1
          ? jsonResponse({ status: 'error', message: 'Unavailable' }, status)
          : jsonResponse({ ok: true });
      };

      assert.deepEqual(
        await apiRequest('/resource', {
          baseUrl: requestOptions.baseUrl,
          retry: { attempts: 2, delayMs: 0 },
        }),
        { ok: true }
      );
      assert.equal(calls, 2);
    }

    const networkCause = new TypeError('temporary network failure');
    let networkCalls = 0;
    globalThis.fetch = async () => {
      networkCalls += 1;
      if (networkCalls === 1) throw networkCause;
      return jsonResponse({ ok: true });
    };

    assert.deepEqual(
      await apiRequest('/resource', {
        baseUrl: requestOptions.baseUrl,
        retry: { attempts: 2, delayMs: 0 },
      }),
      { ok: true }
    );
    assert.equal(networkCalls, 2);
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('does not retry mutations even when retry options are supplied', async () => {
  let calls = 0;

  try {
    globalThis.fetch = async () => {
      calls += 1;
      return jsonResponse({ status: 'error', message: 'Unavailable' }, 503);
    };

    await assert.rejects(
      apiRequest('/resource', {
        baseUrl: requestOptions.baseUrl,
        method: 'POST',
        body: { name: 'test' },
        retry: { attempts: 3, delayMs: 0 },
      }),
      (error: unknown) =>
        error instanceof ApiError && error.httpStatus === 503
    );
    assert.equal(calls, 1);
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('classifies an already aborted external signal and preserves its reason', async () => {
  const controller = new AbortController();
  const reason = new Error('navigation changed');
  controller.abort(reason);
  let calls = 0;

  try {
    globalThis.fetch = async () => {
      calls += 1;
      throw reason;
    };

    await assert.rejects(
      apiRequest('/resource', {
        baseUrl: requestOptions.baseUrl,
        signal: controller.signal,
        retry: { attempts: 2, delayMs: 0 },
      }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.transportCode === 'ABORTED' &&
        error.cause === reason
    );
    assert.equal(calls, 1);
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('times out a pending first attempt within the overall deadline', async () => {
  try {
    globalThis.fetch = async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(init.signal?.reason),
          { once: true }
        );
      });

    await assert.rejects(
      apiRequest('/resource', {
        baseUrl: requestOptions.baseUrl,
        timeoutMs: 10,
        retry: false,
      }),
      (error: unknown) =>
        error instanceof ApiError && error.transportCode === 'TIMEOUT'
    );
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('keeps retry enabled for an active signal and cancels the previous body', async () => {
  const controller = new AbortController();
  let calls = 0;
  let cancelledBodies = 0;

  try {
    globalThis.fetch = async () => {
      calls += 1;

      if (calls === 1) {
        const body = new ReadableStream({
          start(streamController) {
            streamController.enqueue(new TextEncoder().encode('{}'));
          },
          cancel() {
            cancelledBodies += 1;
          },
        });

        return new Response(body, {
          status: 503,
          headers: { 'content-type': 'application/json' },
        });
      }

      return jsonResponse({ ok: true });
    };

    assert.deepEqual(
      await apiRequest('/resource', {
        baseUrl: requestOptions.baseUrl,
        signal: controller.signal,
        retry: { attempts: 2, delayMs: 0 },
      }),
      { ok: true }
    );

    assert.equal(calls, 2);
    assert.equal(cancelledBodies, 1);
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('aborts during retry delay without starting another fetch', async () => {
  const controller = new AbortController();
  let calls = 0;

  try {
    globalThis.fetch = async () => {
      calls += 1;
      return jsonResponse({ status: 'error', message: 'Unavailable' }, 503);
    };

    const request = apiRequest('/resource', {
      baseUrl: requestOptions.baseUrl,
      signal: controller.signal,
      timeoutMs: 5_000,
      retry: { attempts: 3, delayMs: 1_000 },
    });

    setTimeout(() => controller.abort(), 5);

    await assert.rejects(
      request,
      (error: unknown) =>
        error instanceof ApiError && error.transportCode === 'ABORTED'
    );
    assert.equal(calls, 1);
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('applies timeout to the overall operation including retry delay', async () => {
  let calls = 0;

  try {
    globalThis.fetch = async () => {
      calls += 1;
      return jsonResponse({ status: 'error', message: 'Unavailable' }, 503);
    };

    await assert.rejects(
      apiRequest('/resource', {
        baseUrl: requestOptions.baseUrl,
        timeoutMs: 10,
        retry: { attempts: 3, delayMs: 100 },
      }),
      (error: unknown) =>
        error instanceof ApiError && error.transportCode === 'TIMEOUT'
    );

    assert.equal(calls, 1);
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('validates retry configuration', async () => {
  for (const retry of [
    { attempts: 0 },
    { attempts: -1 },
    { attempts: 1.5 },
    { attempts: Number.NaN },
    { attempts: Number.POSITIVE_INFINITY },
    { delayMs: -1 },
    { statuses: [99] },
    { statuses: [600] },
  ]) {
    await assert.rejects(
      apiRequest('/resource', {
        baseUrl: requestOptions.baseUrl,
        retry,
      }),
      TypeError
    );
  }
});

//===================================================================

test('does not retry 429 without an explicit product policy', async () => {
  let calls = 0;

  try {
    globalThis.fetch = async () => {
      calls += 1;
      return jsonResponse(
        {
          status: 'error',
          message: 'Retry later',
          code: 'RATE_LIMITED',
        },
        429
      );
    };

    await assert.rejects(
      apiRequest('/resource', {
        baseUrl: requestOptions.baseUrl,
        retry: { attempts: 3, delayMs: 0 },
      }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.httpStatus === 429 &&
        error.backendCode === 'RATE_LIMITED'
    );

    assert.equal(calls, 1);
  } finally {
    restoreFetch();
  }
});

//===================================================================

test('validates timeout and preserves the original network cause', async () => {
  for (const timeoutMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    await assert.rejects(
      apiRequest('/resource', {
        baseUrl: requestOptions.baseUrl,
        timeoutMs,
        retry: false,
      }),
      TypeError
    );
  }

  const cause = new TypeError('socket closed');

  try {
    globalThis.fetch = async () => {
      throw cause;
    };

    await assert.rejects(
      apiRequest('/resource', requestOptions),
      (error: unknown) =>
        error instanceof ApiError &&
        error.transportCode === 'NETWORK_ERROR' &&
        error.httpStatus === undefined &&
        error.cause === cause
    );
  } finally {
    restoreFetch();
  }
});
