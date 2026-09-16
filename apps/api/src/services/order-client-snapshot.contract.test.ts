import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===============================================================

const servicePath = path.resolve(
  process.cwd(),
  'src/services/order.service.ts'
);

//===============================================================

test('new checkout and manager orders persist immutable client snapshots', async () => {
  const source = await readFile(servicePath, 'utf8');

  const snapshotWrites =
    source.match(/clientSnapshot:\s*createOrderClientSnapshot\(client\)/g) ??
    [];

  assert.equal(snapshotWrites.length, 2);
  assert.match(source, /const clientSnapshot = order\.clientSnapshot/);
  assert.match(source, /const clientIdentity = clientSnapshot \?\? clientUser/);
  assert.match(source, /clientIdentity\?\.name \?\? clientIdentity\?\.email/);
  assert.match(source, /clientIdentity\?\.phone/);
  assert.match(source, /clientIdentity\?\.address/);
  assert.match(source, /clientIdentity\?\.pictureUrl/);

  assert.doesNotMatch(
    source,
    /clientSnapshot\?\.(?:phone|address|pictureUrl) \?\? clientUser\?\./
  );
});

//===============================================================

test('Walk-in snapshots do not copy synthetic credentials into order history', async () => {
  const source = await readFile(servicePath, 'utf8');

  assert.match(
    source,
    /if \(isDefaultPharmacyClient\) \{[\s\S]{0,280}name: 'Walk-in client'[\s\S]{0,280}isDefaultPharmacyClient: true/
  );

  const walkInBranch = source.match(
    /if \(isDefaultPharmacyClient\) \{([\s\S]*?)\n  \}/
  );

  assert.ok(walkInBranch);
  assert.doesNotMatch(walkInBranch[1], /email:/);
  assert.doesNotMatch(walkInBranch[1], /phone:/);
  assert.doesNotMatch(walkInBranch[1], /pictureUrl:/);
});
