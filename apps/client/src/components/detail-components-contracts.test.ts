import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readComponent(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

//===================================================================

test('keeps Product Details split by lifecycle responsibility', async () => {
  const [page, offers, offerList, offerCard, characteristics] =
    await Promise.all([
      readComponent(
        './product-catalog/ProductDetailsPageContent/ProductDetailsPageContent.tsx'
      ),

      readComponent(
        './product-catalog/ProductDetailsPageContent/ProductOffersPanel.tsx'
      ),

      readComponent(
        './product-catalog/ProductDetailsPageContent/ProductOfferList.tsx'
      ),

      readComponent(
        './product-catalog/ProductDetailsPageContent/ProductOfferCard.tsx'
      ),

      readComponent(
        './product-catalog/ProductDetailsPageContent/ProductCharacteristicsPanel.tsx'
      ),
    ]);

  assert.ok(page.split(/\r?\n/).length < 180);
  assert.match(page, /ProductDetailsHero/);
  assert.match(page, /ProductOffersPanel/);
  assert.match(page, /ProductCharacteristicsPanel/);
  assert.match(page, /ProductReviewsPanel/);
  assert.doesNotMatch(page, /getProductDetails|loadCart|setTimeout|aria-live/);

  assert.match(offerList, /key=\{offer\.id\}/);
  assert.doesNotMatch(offerList, /offer\.pharmacyId/);
  assert.match(offerCard, /Favorite pharmacy/);
  assert.match(offerCard, /href=\{phoneHref\}/);

  assert.match(
    offerCard,
    /Quantity for \$\{productName\} from \$\{offer\.pharmacyName\}/
  );

  assert.match(offerCard, /CART_ITEM_TTL_DAYS/);
  assert.doesNotMatch(offerCard, /3 days/);
  assert.doesNotMatch(offers, /isOffersLoadingMore|setTimeout/);
  assert.match(characteristics, /Detailed description is not available yet/);

  assert.doesNotMatch(
    characteristics,
    /compare pharmacy prices|matches your needs/i
  );
});

//===================================================================

test('keeps Pharmacy Details retryable and separates contact from receipt email', async () => {
  const [page, hero, contact, bankPanel, bankHook, about] = await Promise.all([
    readComponent(
      './pharmacies/PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
    ),

    readComponent(
      './pharmacies/PharmacyDetailsPageContent/PharmacyDetailsHero.tsx'
    ),

    readComponent(
      './pharmacies/PharmacyDetailsPageContent/PharmacyContactPanel.tsx'
    ),

    readComponent(
      './pharmacies/PharmacyDetailsPageContent/PharmacyBankDetailsPanel.tsx'
    ),

    readComponent(
      './pharmacies/PharmacyDetailsPageContent/usePharmacyBankDetails.ts'
    ),

    readComponent(
      './pharmacies/PharmacyDetailsPageContent/PharmacyAboutPanel.tsx'
    ),
  ]);

  assert.ok(page.split(/\r?\n/).length < 190);
  assert.match(page, /PharmacyDetailsHero/);
  assert.match(page, /PharmacyBankDetailsPanel/);
  assert.match(page, /PharmacyAboutPanel/);
  assert.match(page, /PharmacyReviewsPanel/);
  assert.doesNotMatch(page, /queueMicrotask|aria-live="polite"[^>]*tabSection/);

  assert.match(hero, /<h1 className=\{css\.title\}>\{pharmacy\.name\}<\/h1>/);
  assert.doesNotMatch(hero, /pharmacy pharmacy/);
  assert.match(contact, /mailto:\$\{pharmacy\.email\}/);
  assert.match(contact, /Copy pharmacy email/);
  assert.match(bankPanel, /state\.data\.receiptEmail/);
  assert.match(bankPanel, /Retry/);
  assert.match(bankHook, /status: 'error'/);
  assert.match(bankHook, /controllerRef\.current\?\.abort\(\)/);
  assert.doesNotMatch(bankHook, /queueMicrotask/);
  assert.match(about, /has not added a public description yet/);
  assert.doesNotMatch(about, /active E-PHARMACY partner|mini quest|white coat/);
});

//===================================================================

test('keeps detail feature public APIs minimal and nested barrels removed', async () => {
  const [productApi, pharmacyApi] = await Promise.all([
    readComponent('./product-catalog/index.ts'),
    readComponent('./pharmacies/index.ts'),
  ]);

  assert.deepEqual(productApi.match(/export /g)?.length, 2);
  assert.deepEqual(pharmacyApi.match(/export /g)?.length, 2);

  assert.doesNotMatch(
    productApi,
    /ProductsList|FiltersForm|DetailsPageContent/
  );

  assert.doesNotMatch(
    pharmacyApi,
    /PharmaciesList|FiltersForm|DetailsPageContent/
  );

  for (const relativePath of [
    './product-catalog/ProductCard/index.ts',
    './product-catalog/ProductsList/index.ts',
    './product-catalog/ProductCatalogFiltersForm/index.ts',
    './product-catalog/ProductCatalogPageContent/index.ts',
    './product-catalog/ProductDetailsPageContent/index.ts',
    './pharmacies/PharmacyCard/index.ts',
    './pharmacies/PharmaciesList/index.ts',
    './pharmacies/PharmaciesCatalogFiltersForm/index.ts',
    './pharmacies/PharmaciesPageContent/index.ts',
    './pharmacies/PharmacyDetailsPageContent/index.ts',
  ]) {
    await assert.rejects(access(new URL(relativePath, import.meta.url)));
  }
});
