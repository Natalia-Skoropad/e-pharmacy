import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readComponent(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('keeps pharmacy status badges on typed domain maps', async () => {
  const [orders, clients, products, requests, profile] = await Promise.all([
    readComponent('./orders/OrdersTable/OrdersTable.tsx'),
    readComponent('./clients/ClientsTable/ClientsTable.tsx'),
    readComponent('./products/OwnProductsTable/OwnProductsTable.tsx'),
    readComponent(
      './product-requests/ProductRequestsTable/ProductRequestsTable.tsx'
    ),
    readComponent(
      './profile/PharmacyProfilePageContent/PharmacyProfilePageContent.tsx'
    ),
  ]);

  assert.match(orders, /ORDER_STATUS_PRESENTATION\[order\.status\]/);
  assert.match(orders, /DELIVERY_METHOD_LABELS\[order\.deliveryMethod\]/);
  assert.match(orders, /PAYMENT_METHOD_LABELS\[order\.paymentMethod\]/);
  assert.match(clients, /USER_STATUS_PRESENTATION\[client\.status\]/);
  assert.match(products, /PRODUCT_STATUS_PRESENTATION\[product\.status\]/);
  assert.match(
    requests,
    /PRODUCT_REQUEST_STATUS_PRESENTATION\[request\.status\]/
  );
  assert.match(profile, /PHARMACY_STATUS_PRESENTATION\[pharmacy\.status\]/);

  assert.doesNotMatch(
    [orders, clients, products, requests, profile].join('\n'),
    /getStatusPresentation/
  );
});
