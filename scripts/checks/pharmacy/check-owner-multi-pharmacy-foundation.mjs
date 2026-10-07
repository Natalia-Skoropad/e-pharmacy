import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');

//===================================================================

const [pharmacyModel, migration, ownerReadService, lifecycleIntegration] =
  await Promise.all([
    read('apps', 'api', 'src', 'models', 'pharmacy.model.ts'),
    read(
      'apps',
      'api',
      'src',
      'services',
      'pharmacy-owner-foundation-migration.service.ts'
    ),

    read(
      'apps',
      'api',
      'src',
      'services',
      'admin-pharmacy-owner-read.service.ts'
    ),

    read(
      'apps',
      'api',
      'src',
      'services',
      'pharmacy-owner-lifecycle.mongo.integration.test.ts'
    ),
  ]);

//===================================================================
// Pharmacy.ownerId is many-to-one: schema field has no unique flag and all
// owner indexes are explicitly non-unique.

const ownerFieldStart = pharmacyModel.indexOf('ownerId: {');
const ownerFieldEnd = pharmacyModel.indexOf('managerUserIds:', ownerFieldStart);
const ownerField = pharmacyModel.slice(ownerFieldStart, ownerFieldEnd);

assert.ok(ownerFieldStart >= 0, 'Pharmacy.ownerId field must exist.');
assert.doesNotMatch(ownerField, /unique\s*:\s*true/);
assert.match(pharmacyModel, /pharmacySchema\.index\(\{ ownerId: 1 \}\)/);

assert.match(
  pharmacyModel,
  /pharmacySchema\.index\(\{ ownerId: 1, status: 1 \}\)/
);

assert.match(
  pharmacyModel,
  /pharmacySchema\.index\(\{ ownerId: 1, createdAt: -1 \}\)/
);

assert.doesNotMatch(
  pharmacyModel,
  /pharmacySchema\.index\(\{ ownerId: 1 \},\s*\{[^}]*unique\s*:\s*true/
);

//===================================================================
// Migration drops legacy unique owner indexes and recreates canonical indexes
// without a unique option.

assert.match(migration, /if \(existing\?\.unique\)/);
assert.match(migration, /collection\.dropIndex\(existing\.name\)/);

assert.match(
  migration,
  /collection\.createIndex\(definition\.key,\s*\{\s*name:\s*definition\.name,?\s*\}\)/
);

assert.doesNotMatch(
  migration,
  /createIndex\(definition\.key,[\s\S]{0,160}?unique\s*:\s*true/
);

//===================================================================
// Admin owners domain treats linked pharmacies as collections, not one-to-one.

assert.match(
  ownerReadService,
  /listAdminPharmacyOwnersService[\s\S]*?\$lookup:[\s\S]*?Pharmacy\.collection\.name/
);

assert.match(
  ownerReadService,
  /listAdminPharmacyOwnerPharmaciesService[\s\S]*?Pharmacy\.aggregate/
);

assert.doesNotMatch(ownerReadService, /Pharmacy\.findOne\(\{\s*ownerId/);

//===================================================================
// Mongo lifecycle coverage creates multiple pharmacies for one owner and
// verifies cascade/reactivation semantics across the whole set.

assert.match(
  lifecycleIntegration,
  /const \[firstPharmacy, secondPharmacy\] = await Pharmacy\.create\(\[/
);

assert.match(
  lifecycleIntegration,
  /ownerId:\s*owner\._id[\s\S]*?ownerId:\s*owner\._id/
);

assert.match(lifecycleIntegration, /blockedPharmacies, 2/);
assert.match(lifecycleIntegration, /\['blocked', 'blocked'\]/);

console.log('Owner multi-pharmacy foundation checks passed.');
