import assert from 'node:assert/strict';
import test from 'node:test';

import { validateBffMutationRequest } from './csrf.ts';
import { BFF_CSRF_HEADER_NAME, BFF_CSRF_HEADER_VALUE } from './bff-contract.ts';

//===================================================================

function createRequest(headers: HeadersInit = {}): Request {
  return new Request('https://client.example/api/orders', {
    method: 'POST',
    headers,
  });
}

//===================================================================

test('accepts same-origin mutations with the BFF CSRF header', () => {
  assert.doesNotThrow(() =>
    validateBffMutationRequest(
      createRequest({
        [BFF_CSRF_HEADER_NAME]: BFF_CSRF_HEADER_VALUE,
        Origin: 'https://client.example',
        'Sec-Fetch-Site': 'same-origin',
      }),
      'POST'
    )
  );
});

//===================================================================

test('rejects missing header and cross-site requests', () => {
  assert.throws(() => validateBffMutationRequest(createRequest(), 'POST'));
  assert.throws(() =>
    validateBffMutationRequest(
      createRequest({
        [BFF_CSRF_HEADER_NAME]: BFF_CSRF_HEADER_VALUE,
        Origin: 'https://evil.example',
        'Sec-Fetch-Site': 'cross-site',
      }),
      'POST'
    )
  );
});

//===================================================================

test('does not require CSRF validation for GET', () => {
  assert.doesNotThrow(() => validateBffMutationRequest(createRequest(), 'GET'));
});
