import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import CheckoutOrderPanel from './CheckoutOrderPanel/CheckoutOrderPanel';

//===================================================================

test('checkout confirmation button follows the validated canSubmit state', () => {
  const orderGroup = {
    pharmacyId: '507f1f77bcf86cd799439011',
    pharmacyName: 'Test Pharmacy',
    items: [],
    totalItems: 1,
    totalPrice: 100,
  };

  const blockedMarkup = renderToStaticMarkup(
    <CheckoutOrderPanel
      orderGroup={orderGroup}
      canSubmit={false}
      isSubmitting={false}
      onSubmit={() => undefined}
    />
  );

  assert.match(blockedMarkup, /disabled=""/);

  const readyMarkup = renderToStaticMarkup(
    <CheckoutOrderPanel
      orderGroup={orderGroup}
      canSubmit
      isSubmitting={false}
      onSubmit={() => undefined}
    />
  );

  assert.doesNotMatch(readyMarkup, /disabled=""/);
});
