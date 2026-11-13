import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

//===============================================================

test('client pharmacy registry is restricted to owner and client relationship', () => {
  const service = read('services/clients/client-pharmacies.service.ts');

  assert.match(service, /getClientByIdService\(userId, clientId, true\)/);
  assert.match(service, /getOwnedClientPharmacyIds\(userId\)/);
  assert.match(service, /client\.isDefault\s*\? ownedIds\.filter/);
  assert.match(service, /: orderMetrics\.map/);
  assert.match(service, /ownerId: new Types\.ObjectId\(userId\)/);

  assert.match(
    service,
    /filteredIds\.filter\(\(id\) => String\(id\) === query\.pharmacyId\)/
  );

  assert.match(service, /userId: new Types\.ObjectId\(clientId\)/);
});

//===============================================================

test('only successful client orders affect pharmacy row revenue and counts', () => {
  const service = read('services/clients/client-pharmacies.service.ts');
  const routes = read('routes/clients/client.routes.ts');

  assert.match(service, /\$eq: \['\$status', 'successful'\]/);

  assert.match(
    service,
    /successfulOrdersCount: metric\?\.successfulOrdersCount \?\? 0/
  );

  assert.match(
    service,
    /successfulOrdersAmount: metric\?\.successfulOrdersAmount \?\? 0/
  );

  assert.match(
    service,
    /firstOrderAt: metric\?\.firstOrderAt\?\.toISOString\(\) \?\? null/
  );

  assert.match(service, /\.skip\(\(page - 1\) \* query\.perPage\)/);

  assert.match(
    routes,
    /'\/:clientId\/pharmacies',[\s\S]*?query: ownedPharmacyRegistryListQuerySchema/
  );
});
