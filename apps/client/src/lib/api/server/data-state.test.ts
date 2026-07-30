import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import {
  getServerDataErrorContext,
  resolveServerDataState,
} from './data-state';

//===================================================================

test('classifies semantic transport and HTTP failures', () => {
  assert.deepEqual(
    getServerDataErrorContext(
      new ApiError('limited', {
        httpStatus: 429,
        requestId: 'req-429',
        backendCode: 'rate_limited',
      })
    ),

    {
      reason: 'rate_limit',
      requestId: 'req-429',
      httpStatus: 429,
      backendCode: 'rate_limited',
    }
  );

  assert.equal(
    getServerDataErrorContext(
      new ApiError('bad payload', { transportCode: 'INVALID_RESPONSE' })
    ).reason,
    'invalid_response'
  );
});

//===================================================================

test('does not convert abort into an unavailable state', async () => {
  await assert.rejects(
    resolveServerDataState(
      Promise.reject(new DOMException('Navigation changed', 'AbortError'))
    ),
    
    (error: unknown) =>
      error instanceof DOMException && error.name === 'AbortError'
  );
});
