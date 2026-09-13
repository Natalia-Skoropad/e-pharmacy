import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('managed product reads bind pharmacy scope to the authenticated actor', async () => {
  const [controller, service, pharmacyBff] = await Promise.all([
    readFile(
      resolve(process.cwd(), 'src/controllers/product.controller.ts'),
      'utf8'
    ),

    readFile(resolve(process.cwd(), 'src/services/product.service.ts'), 'utf8'),

    readFile(
      resolve(process.cwd(), '../pharmacy/src/app/api/products/route.ts'),
      'utf8'
    ),
  ]);

  assert.match(
    controller,
    /getManagedProductsService\([\s\S]*?userId: req\.user\?\.id[\s\S]*?role: req\.user\?\.role/
  );

  assert.match(
    service,
    /getCurrentUserPharmacyForManagedProductRead[\s\S]*?ownerId: userId[\s\S]*?managerUserIds: userId/
  );

  assert.match(
    service,
    /assertCurrentPharmacyScope\(query\.pharmacyId, currentPharmacyId\)/
  );
  assert.match(
    service,
    /assertCurrentPharmacyScope\(query\.addedToPharmacyId, currentPharmacyId\)/
  );
  assert.match(
    service,
    /actor\.role === USER_ROLES\.ADMIN[\s\S]*?mode: 'admin-management'/
  );

  assert.match(
    pharmacyBff,
    /createPrivateProxyRoute\([\s\S]*?backendPath: API_ROUTES\.products\.managementList[\s\S]*?method: 'GET'/
  );
});

//===================================================================

test('pharmacy management offer projection exposes operational fields only for the current pharmacy', async () => {
  const service = await readFile(
    resolve(process.cwd(), 'src/services/product.service.ts'),
    'utf8'
  );

  assert.match(
    service,
    /visibility\.mode === 'pharmacy-management'[\s\S]*?String\(offer\.pharmacyId\) === visibility\.pharmacyId/
  );

  assert.match(
    service,
    /canSeeOperationalFields[\s\S]*?totalQuantity: offer\.totalQuantity[\s\S]*?reservedQuantity: offer\.reservedQuantity[\s\S]*?hasRelatedOrders:/
  );

  assert.match(
    service,
    /pharmacyFilter\.\$or = \[[\s\S]*?PUBLIC_PRODUCT_OFFER_PHARMACY_STATUSES[\s\S]*?new Types\.ObjectId\(visibility\.pharmacyId\)/
  );
});
