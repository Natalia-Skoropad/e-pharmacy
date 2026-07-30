import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readComponent(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('keeps client order and user presentation domain-specific', async () => {
  const [profile, orderDetails] = await Promise.all([
    readComponent('./profile/ProfilePageContent/ProfilePageContent.tsx'),

    readComponent(
      './profile/OrderDetailsPageContent/OrderDetailsPageContent.tsx'
    ),
  ]);

  assert.match(profile, /ORDER_STATUS_PRESENTATION\[order\.status\]/);
  assert.match(profile, /USER_STATUS_PRESENTATION\[user\.status\]/);
  assert.match(orderDetails, /ORDER_STATUS_PRESENTATION\[order\.status\]/);
  assert.match(orderDetails, /PAYMENT_METHOD_LABELS\[order\.paymentMethod\]/);

  assert.match(
    orderDetails,
    /DELIVERY_METHOD_LABELS\[order\.delivery\.method\]/
  );

  assert.doesNotMatch(`${profile}\n${orderDetails}`, /getStatusPresentation/);
});

//===================================================================

test('keeps client delivery and payment copy on canonical maps', async () => {
  const sources = await Promise.all([
    readComponent('./info/config/delivery-payment.ts'),
    readComponent('./common/DeliveryInfoCard/DeliveryInfoCard.tsx'),
    readComponent('./common/PaymentInfoCard/PaymentInfoCard.tsx'),
    readComponent('./checkout/CheckoutPaymentMethod/CheckoutPaymentMethod.tsx'),
    readComponent('./checkout/CheckoutPageContent/CheckoutPageContent.tsx'),
  ]);

  const combined = sources.join('\n');
  assert.match(combined, /DELIVERY_METHOD_LABELS/);
  assert.match(combined, /PAYMENT_METHOD_LABELS/);
  assert.doesNotMatch(combined, /Post delivery/);
});
