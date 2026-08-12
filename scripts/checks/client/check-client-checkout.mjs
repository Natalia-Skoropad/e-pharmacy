import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

//===================================================================

const submit = await read(
  'apps/client/src/components/checkout/hooks/useCheckoutSubmit.ts'
);

for (const contract of [
  'submitLockRef',
  'AbortController',
  'getCart',
  'createCheckoutGroupFingerprint(selectedOrderGroup)',
  'createCheckoutGroupFingerprint(latestOrderGroup)',
  'expectedCartRevision: latestCartResponse.cart.revision',
  'groupFingerprint: latestGroupFingerprint',
  'CHECKOUT_CART_CHANGED_ERROR_CODE',
  'replaceCartFromServer',
]) {
  assert.match(
    submit,
    new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  );
}

assert.match(
  submit,
  /shownGroupFingerprint\s*!==\s*latestGroupFingerprint[\s\S]*?replaceCartFromServer\(latestCartResponse\.cart\)[\s\S]*?return;/,
  'Changed checkout snapshot must refresh the cart and stop before POST.'
);

for (const errorCode of [
  'CHECKOUT_GROUP_MISSING_ERROR_CODE',
  'STOCK_CHANGED_ERROR_CODE',
  'PHARMACY_UNAVAILABLE_ERROR_CODE',
  'PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE',
]) {
  assert.match(submit, new RegExp(errorCode));
}

const pharmacyResource = await read(
  'apps/client/src/components/checkout/hooks/useCheckoutPharmacy.ts'
);

const checkoutPage = await read(
  'apps/client/src/components/checkout/CheckoutPageContent/CheckoutPageContent.tsx'
);

assert.match(pharmacyResource, /'idle' \| 'loading' \| 'success' \| 'error'/);
assert.match(pharmacyResource, /pharmacyError/);
assert.match(checkoutPage, /pharmacyStatus === 'success'/);
assert.match(checkoutPage, /hasPharmacyLoadError/);

const browserOrders = await read(
  'apps/client/src/lib/api/browser/orders.api.ts'
);

assert.match(browserOrders, /ROUTES\.orders\.checkout/);
assert.doesNotMatch(browserOrders, /https?:\/\//);

const bff = await read('apps/client/src/app/api/orders/checkout/route.ts');
assert.match(bff, /createPrivateProxyRoute/);
assert.match(bff, /API_ROUTES\.orders\.checkout/);

console.log(
  'Client checkout check passed (reviewed snapshot comparison, revision/fingerprint contract, abortable locked submit, same-origin BFF).'
);
