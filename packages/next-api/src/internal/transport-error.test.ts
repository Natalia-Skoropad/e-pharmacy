import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '@e-pharmacy/api-client/transport';

import { describeProxyError } from './transport-error.ts';

//===================================================================

test('classifies a client-aborted backend request separately from an upstream outage', () => {
  const descriptor = describeProxyError(
    new ApiError('The request was cancelled.', {
      transportCode: 'ABORTED',
    })
  );

  assert.deepEqual(descriptor, {
    status: 499,
    code: 'CLIENT_CLOSED_REQUEST',
    message: 'The client closed the request.',
  });
});
