import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const source = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('owner catalog Add requires an Active or On moderation pharmacy before persisting selection', async () => {
  const service = await source(
    'src/services/catalog/owner-product-catalog.service.ts'
  );

  assert.match(
    service,
    /PHARMACY_STATUSES\.ACTIVE[\s\S]*?PHARMACY_STATUSES\.ON_MODERATION/
  );

  const eligibleIndex = service.indexOf('if (activePharmacies.length === 0)');

  const selectionIndex = service.indexOf(
    'await OwnerProductSelection.updateOne(',
    eligibleIndex
  );

  assert.ok(eligibleIndex >= 0 && selectionIndex > eligibleIndex);
  assert.match(service, /HTTP_STATUS\.CONFLICT/);
});

//===================================================================

test('activation sync uses idempotent offers and never initializes existing stock again', async () => {
  const [service, offer, selection, moderation] = await Promise.all([
    source('src/services/catalog/owner-product-catalog.service.ts'),
    source('src/models/inventory/productOffer.model.ts'),
    source('src/models/catalog/ownerProductSelection.model.ts'),
    source('src/services/admin/pharmacies/admin.service.ts'),
  ]);

  assert.match(
    offer,
    /productOfferSchema\.index\(\{ productId: 1, pharmacyId: 1 \}, \{ unique: true \}\)/
  );

  assert.match(
    selection,
    /schema\.index\(\{ ownerId: 1, productId: 1 \}, \{ unique: true \}\)/
  );

  assert.match(service, /ensureOwnerSelectionIndex\(\)/);
  assert.match(service, /OwnerProductSelection\.createIndexes\(\)/);
  assert.match(service, /\$setOnInsert/);
  assert.match(service, /if \(!insertedOfferId\) continue/);
  assert.match(service, /recordInitialStockArrival/);

  assert.match(
    moderation,
    /nextStatus === PHARMACY_STATUSES\.ACTIVE && previousStatus !== PHARMACY_STATUSES\.ACTIVE/
  );

  assert.match(
    moderation,
    /ensureOwnerProductOffers\(String\(saved\.ownerId\), saved\._id, session\)/
  );
});

//===================================================================

test('owner reads never require the selected pharmacy membership', async () => {
  const service = await source(
    'src/services/catalog/product-management.service.ts'
  );

  const access = await source(
    'src/services/catalog/owner-product-catalog.service.ts'
  );

  assert.match(
    service,
    /if \(query\.ownerCatalog && actor\.role === USER_ROLES\.PHARMACY\)/
  );

  assert.match(
    service,
    /offerVisibility: \{ mode: 'owner-management', pharmacyIds \}/
  );

  assert.doesNotMatch(access, /Pharmacy\.exists\(\{ ownerId: userId \}\)/);
});
