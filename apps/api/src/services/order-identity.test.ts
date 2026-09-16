import assert from 'node:assert/strict';
import test from 'node:test';

import type { HttpError } from '../types/errors';
import { getOrderByIdService } from './order.service';

//===================================================================

async function assertInvalidOrderIdIsNotFound(
  role: 'client' | 'pharmacy'
): Promise<void> {
  await assert.rejects(
    () =>
      getOrderByIdService('507f1f77bcf86cd799439011', 'not-an-order-id', role),
    (error: unknown) => {
      const httpError = error as HttpError;
      assert.equal(httpError.status, 404);
      assert.equal(httpError.message, 'Order was not found');
      return true;
    }
  );
}

//===================================================================

test('invalid client order id is rejected before any fallback lookup', async () => {
  await assertInvalidOrderIdIsNotFound('client');
});

//===================================================================

test('invalid pharmacy order id is rejected instead of resolving the latest pharmacy order', async () => {
  await assertInvalidOrderIdIsNotFound('pharmacy');
});
