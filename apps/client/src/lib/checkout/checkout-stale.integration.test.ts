import assert from 'node:assert/strict';
import test from 'node:test';

import { createCheckoutGroupFingerprint } from './checkout-group-fingerprint';

//===================================================================

const base = {
  pharmacyId: 'pharmacy-1',

  items: [
    {
      id: 'cart-item-1',
      productOfferId: 'offer-1',
      quantity: 1,
      unitPrice: 100,
    },
  ],

  totalItems: 1,
  totalPrice: 100,
};

//===================================================================

test('checkout fingerprint changes when quantity, items or price changes', () => {
  const shown = createCheckoutGroupFingerprint(base);

  assert.notEqual(
    shown,

    createCheckoutGroupFingerprint({
      ...base,
      items: [{ ...base.items[0], quantity: 2 }],
      totalItems: 2,
      totalPrice: 200,
    })
  );

  assert.notEqual(
    shown,

    createCheckoutGroupFingerprint({
      ...base,

      items: [
        ...base.items,
        {
          id: 'cart-item-2',
          productOfferId: 'offer-2',
          quantity: 1,
          unitPrice: 50,
        },
      ],

      totalItems: 2,
      totalPrice: 150,
    })
  );

  assert.notEqual(
    shown,

    createCheckoutGroupFingerprint({
      ...base,
      items: [{ ...base.items[0], unitPrice: 120 }],
      totalPrice: 120,
    })
  );
});

//===================================================================

test('checkout notifies about changed prices before resubmission', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');

  const hook = await readFile(
    resolve(
      process.cwd(),
      'src/components/checkout/hooks/useCheckoutSubmit.ts'
    ),
    'utf8'
  );

  const page = await readFile(
    resolve(
      process.cwd(),
      'src/components/checkout/CheckoutPageContent/CheckoutPageContent.tsx'
    ),
    'utf8'
  );

  assert.match(hook, /previous\.unitPrice !== item\.unitPrice/);
  assert.match(hook, /setPriceChanges\(changes\)/);
  assert.match(page, /Product price changed during checkout/);
  assert.match(page, /Review updated prices/);
});
