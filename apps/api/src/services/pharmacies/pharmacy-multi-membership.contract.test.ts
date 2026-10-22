import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const root = process.cwd();
const read = (name: string) => readFile(resolve(root, name), 'utf8');

//===============================================================

// Contract tests run without Mongo and complement integration tests.
test('all tenant access is anchored to the requested pharmacy id', async () => {
  const membership = await read(
    'src/services/pharmacies/pharmacy-membership.service.ts'
  );

  assert.match(
    membership,
    /_id: pharmacyId,\s*\$or: \[\{ ownerId: userId \}, \{ managerUserIds: userId \}\]/
  );

  assert.match(membership, /getSelectedPharmacyId\(\)/);
  assert.match(membership, /memberships\.length > 1/);
  assert.match(membership, /PHARMACY_SELECTION_REQUIRED/);

  assert.match(
    membership,
    /getPharmacyMembership\(userId, String\(memberships\[0\]\._id\)/
  );

  assert.doesNotMatch(membership, /Pharmacy\.findOne\(\{\s*\$or:/);
});

//===============================================================

test('legacy managers cannot implicitly manage orders, products or owner documents', async () => {
  const [membership, ownerDocuments] = await Promise.all([
    read('src/services/pharmacies/pharmacy-membership.service.ts'),
    read('src/services/owners/pharmacy-owner-document.service.ts'),
  ]);

  const managerGrants =
    membership.match(/const MANAGER_CAPABILITIES[^=]*= \[([\s\S]*?)\];/)?.[1] ??
    '';

  for (const capability of [
    'manage_orders',
    'manage_products',
    'manage_clients',
    'manage_documents',
    'edit_profile',
    'submit_profile',
    'manage_product_requests',
  ]) {
    assert.doesNotMatch(managerGrants, new RegExp(`'${capability}'`));
  }

  assert.match(ownerDocuments, /managesPharmacy && !ownsPharmacy/);
  assert.match(membership, /status === USER_STATUSES\.BLOCKED/);
  assert.match(membership, /pharmacy\.status === PHARMACY_STATUSES\.BLOCKED/);
});

//===============================================================

test('all member-facing business modules use the centralized capability gate', async () => {
  const checks: Record<string, string> = {
    'src/services/order.service.ts': 'manage_orders',
    'src/services/clients/client.service.ts': 'read_clients',
    'src/services/catalog/product.service.ts': 'manage_products',

    'src/services/catalog/product-request.service.ts':
      'manage_product_requests',

    'src/services/inventory/stockMovement.service.ts': 'read_stock',

    'src/services/pharmacies/pharmacy-note.service.ts':
      'findPharmacyForInternalNotesAccess',

    'src/services/pharmacies/pharmacy.service.ts':
      'findPharmacyForProfileAccess',

    'src/services/pharmacies/pharmacy-document.service.ts':
      'findPharmacyForProfileAccess',
  };

  for (const [name, capability] of Object.entries(checks)) {
    assert.ok(
      (await read(name)).includes(capability),
      `${name} must use ${capability}`
    );
  }
});

//===============================================================

test('selected pharmacy is request-local and BFF forwards only a valid id', async () => {
  const [middleware, app, bff, route] = await Promise.all([
    read('src/middlewares/pharmacy-selection.middleware.ts'),
    read('src/app.ts'),
    read('../../packages/next-api/src/internal/request-headers.ts'),
    read('../pharmacy/src/app/api/pharmacies/me/memberships/route.ts'),
  ]);

  assert.match(middleware, /AsyncLocalStorage/);
  assert.match(middleware, /Types\.ObjectId\.isValid\(value\)/);
  assert.match(app, /app\.use\(attachPharmacySelection\)/);
  assert.match(bff, /PHARMACY_ID_PATTERN\.test\(pharmacyId\)/);
  assert.match(route, /myMemberships/);
});
