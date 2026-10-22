import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===============================================================

const readOrderFile = (name: string) =>
  readFile(path.resolve(process.cwd(), 'src/services/orders', name), 'utf8');

//===============================================================

test('new checkout and manager orders persist immutable client snapshots', async () => {
  const source = (
    await Promise.all([
      readOrderFile('order-checkout.service.ts'),
      readOrderFile('order-manager-orders.service.ts'),
    ])
  ).join('\n');

  const serializer = await readOrderFile('order-shared.ts');

  const snapshotWrites =
    source.match(/clientSnapshot:\s*createOrderClientSnapshot\(client\)/g) ??
    [];

  assert.equal(snapshotWrites.length, 2);
  assert.match(serializer, /const clientSnapshot = order\.clientSnapshot/);

  assert.match(
    serializer,
    /const clientIdentity = clientSnapshot \?\? clientUser/
  );

  assert.match(
    serializer,
    /clientIdentity\?\.name \?\? clientIdentity\?\.email/
  );

  assert.match(serializer, /clientIdentity\?\.phone/);
  assert.match(serializer, /clientIdentity\?\.address/);
  assert.match(serializer, /clientIdentity\?\.pictureUrl/);

  assert.doesNotMatch(
    serializer,
    /clientSnapshot\?\.(?:phone|address|pictureUrl) \?\? clientUser\?\./
  );
});

//===============================================================

test('Walk-in snapshots do not copy synthetic credentials into order history', async () => {
  const source = await readOrderFile('order-shared.ts');

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
