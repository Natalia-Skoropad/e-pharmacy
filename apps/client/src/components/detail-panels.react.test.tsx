import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import type { ProductDetails } from '@e-pharmacy/types/products';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import { ProductCharacteristicsPanel } from './product-catalog/ProductDetailsPageContent/ProductCharacteristicsPanel';
import { PharmacyAboutPanel } from './pharmacies/PharmacyDetailsPageContent/PharmacyAboutPanel';
import { PharmacyBankDetailsPanel } from './pharmacies/PharmacyDetailsPageContent/PharmacyBankDetailsPanel';

//===================================================================

const product = {
  id: 'product-1',
  name: 'Test product',
  publicSlugId: 'test-product',
  article: 'TEST-1',
  category: 'medicine',
  status: 'active',
  price: 0,
  foundInPharmaciesCount: 0,
  availableInPharmaciesCount: 0,
  inStock: false,
  rating: 0,
  reviewsCount: 0,
  isFavorite: false,
  offers: [],
  createdAt: '2026-08-03T00:00:00.000Z',
  updatedAt: '2026-08-03T00:00:00.000Z',
} as unknown as ProductDetails;

const pharmacy = {
  id: 'pharmacy-1',
  name: 'Test pharmacy',
  publicSlugId: 'test-pharmacy',
  address: 'Test address',
  rating: 0,
  availableProductsCount: 0,
  reviewsCount: 0,
  isFavorite: false,
  bankTransferAvailable: true,
  updatedAt: '2026-08-03T00:00:00.000Z',
} as unknown as PublicPharmacy;

//===================================================================

test('renders honest description fallbacks', () => {
  const productMarkup = renderToStaticMarkup(
    <ProductCharacteristicsPanel product={product} />
  );

  const pharmacyMarkup = renderToStaticMarkup(
    <PharmacyAboutPanel pharmacy={pharmacy} />
  );

  assert.match(productMarkup, /Detailed description is not available yet/);
  assert.match(pharmacyMarkup, /has not added a public description yet/);
});

//===================================================================

test('renders the bank receipt email from payment details and retry state', () => {
  const successMarkup = renderToStaticMarkup(
    <PharmacyBankDetailsPanel
      state={{
        status: 'success',
        data: {
          recipientName: 'Recipient',
          taxId: '12345678',
          iban: 'UA123456789012345678901234567',
          bankName: 'Bank',
          paymentPurpose: 'Order payment',
          receiptEmail: 'receipts@example.com',
        },
      }}
      onRetry={() => undefined}
      onCopy={async () => true}
    />
  );

  const errorMarkup = renderToStaticMarkup(
    <PharmacyBankDetailsPanel
      state={{ status: 'error', error: new Error('temporary') }}
      onRetry={() => undefined}
      onCopy={async () => true}
    />
  );

  assert.match(successMarkup, /receipts@example\.com/);
  assert.match(successMarkup, /mailto:receipts@example\.com/);
  assert.match(errorMarkup, />Retry</);
});
