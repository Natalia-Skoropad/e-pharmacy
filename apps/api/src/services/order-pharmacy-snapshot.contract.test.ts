import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===============================================================

const servicePath = path.resolve(
  process.cwd(),
  'src/services/order.service.ts'
);

const modelPath = path.resolve(process.cwd(), 'src/models/order.model.ts');
const seedPath = path.resolve(process.cwd(), 'src/scripts/seed.ts');

//===============================================================

test('order responses keep the confirmed pharmacy snapshot immutable', async () => {
  const source = await readFile(servicePath, 'utf8');

  assert.doesNotMatch(source, /hydrateOrderPharmacyDetails/);

  assert.doesNotMatch(
    source,
    /Pharmacy\.findById\(order\.pharmacyId\)[\s\S]{0,400}pharmacySnapshot/
  );

  assert.match(source, /serializeOrder\(\s*order,/);

  assert.match(
    source,
    /input\.paymentMethod === 'bank_transfer'[\s\S]{0,180}order\.pharmacySnapshot\.bankDetails/
  );
});

//===============================================================

test('new order snapshots persist canonical location while legacy address/city snapshots remain readable', async () => {
  const [service, model] = await Promise.all([
    readFile(servicePath, 'utf8'),
    readFile(modelPath, 'utf8'),
  ]);

  assert.match(model, /orderPharmacyLocationSnapshotSchema/);

  assert.match(
    model,
    /location:\s*\{[\s\S]*?orderPharmacyLocationSnapshotSchema/
  );

  // Historical fields remain persistence-only compatibility until 13.4.7.
  assert.match(model, /Historical snapshots created before Stage 13\.4\.6/);
  assert.match(model, /address:\s*\{ type: String/);
  assert.match(model, /city:\s*\{ type: String/);

  assert.match(
    service,
    /pharmacySnapshot:\s*createOrderPharmacySnapshot\(pharmacy\)/
  );

  assert.doesNotMatch(
    service,
    /pharmacySnapshot:\s*\{[\s\S]{0,220}?city:\s*pharmacy\.location\.settlement/
  );

  assert.match(
    service,
    /getOrderPharmacyLocation[\s\S]*?pharmacySnapshot\.location[\s\S]*?pharmacySnapshot\.address[\s\S]*?pharmacySnapshot\.city/
  );

  assert.match(service, /pharmacyLocation \? \{ pharmacyLocation \} : \{\}/);
});
//===============================================================

test('seeded orders also use canonical location snapshots', async () => {
  const seed = await readFile(seedPath, 'utf8');
  const snapshotDeclarations = seed.match(/const pharmacySnapshot = \{/g) ?? [];

  const canonicalSnapshots =
    seed.match(/const pharmacySnapshot = \{[\s\S]{0,700}?location:/g) ?? [];

  assert.equal(snapshotDeclarations.length, 3);
  assert.equal(canonicalSnapshots.length, 3);

  assert.doesNotMatch(
    seed,
    /const pharmacySnapshot = \{[\s\S]{0,700}?\bcity:\s*pharmacy\.location/
  );
});
