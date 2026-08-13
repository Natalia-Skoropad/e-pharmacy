import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import { PharmacyContactPanel } from './PharmacyContactPanel';

//===================================================================

const pharmacy = {
  id: 'pharmacy-1',
  publicSlugId: 'care-pharmacy',
  name: 'Care Pharmacy',
  address: '1 Test Street',
  city: 'Lviv',
  phone: '+380 44 123 45 67',
  email: 'contact@example.com',
  workingHours:
    'Mon: 09:00-18:00; Tue: 09:00-18:00; Wed: 09:00-18:00; Thu: 09:00-18:00; Fri: 09:00-18:00; Sat: 10:00-17:00; Sun: Closed',
  rating: 4.9,
  availableProductsCount: 24,
  reviewsCount: 10,
  isFavorite: false,
  bankTransferAvailable: true,
  updatedAt: '2026-08-03T00:00:00.000Z',
} as unknown as PublicPharmacy;

//===================================================================

test('separates contact-email navigation from the explicit copy action', () => {
  const markup = renderToStaticMarkup(
    <PharmacyContactPanel
      pharmacy={pharmacy}
      productsHref="/product-catalog/pharmacy-pharmacy-1"
      onCopy={async () => true}
    />
  );

  assert.match(markup, /href="mailto:contact@example.com"/);
  assert.match(markup, /aria-label="Copy pharmacy email contact@example.com"/);
  assert.match(markup, /href="tel:\+380441234567"/);
  assert.match(markup, /<strong>Mon<\/strong>:\s*09:00-18:00/);
  assert.match(markup, /<strong>Sun<\/strong>:\s*Closed/);
});
