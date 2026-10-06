import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFile(resolve(process.cwd(), relativePath), 'utf8');

//===================================================================

test('Stage 13.4.5 exposes canonical location and email in pharmacy cards', async () => {
  const [serviceSource, typeSource] = await Promise.all([
    read('src/services/pharmacy.service.ts'),
    read('src/types/pharmacy.ts'),
  ]);

  const serializer = serviceSource.slice(
    serviceSource.indexOf('function serializePharmacyCardSummary'),
    serviceSource.indexOf('function serializePublicPharmacy')
  );

  const cardDto = typeSource.slice(
    typeSource.indexOf('export type PharmacyCardSummaryResponseDto'),
    typeSource.indexOf('export type PublicPharmacyResponseDto')
  );

  assert.match(serializer, /location:\s*\{/);
  assert.match(serializer, /settlement:\s*pharmacy\.location\.settlement/);
  assert.match(serializer, /region:\s*pharmacy\.location\.region/);
  assert.match(serializer, /email:\s*pharmacy\.email/);

  assert.doesNotMatch(
    serializer,
    /\{\s*city:\s*pharmacy\.location\.settlement\s*\}/
  );

  assert.match(cardDto, /location\?:\s*PharmacyLocationDraft/);
  assert.match(cardDto, /email\?:\s*string/);
  assert.doesNotMatch(cardDto, /\baddress\?:/);
  assert.doesNotMatch(cardDto, /\bcity\?:/);
});

//===================================================================

test('Stage 13.4.5 builds Location options only from active pharmacies and keeps settlement plus region distinct', async () => {
  const serviceSource = await read('src/services/pharmacy.service.ts');

  const filterService = serviceSource.slice(
    serviceSource.indexOf('export async function getPharmacyFiltersService'),
    serviceSource.indexOf('export async function getPharmacyOptionsService')
  );

  assert.match(filterService, /status:\s*PHARMACY_STATUSES\.ACTIVE/);
  assert.doesNotMatch(filterService, /PUBLIC_PHARMACY_STATUS_FILTER/);
  assert.match(filterService, /location\.settlement/);
  assert.match(filterService, /location\.region/);
  assert.match(filterService, /uniqueLocations/);
  assert.match(filterService, /settlementCounts/);
  assert.match(filterService, /locations:\s*locations\.map/);

  assert.match(
    filterService,
    /\$\{location\.settlement\} \(\$\{location\.region/
  );
});

//===================================================================

test('Stage 13.4.5 address search covers address, settlement and region and location filters are structured', async () => {
  const [serviceSource, schemaSource] = await Promise.all([
    read('src/services/pharmacy.service.ts'),
    read('src/schemas/pharmacy.schema.ts'),
  ]);

  const catalogService = serviceSource.slice(
    serviceSource.indexOf('export async function getPharmaciesService'),
    serviceSource.indexOf('export async function getPharmacyDetailsService')
  );

  assert.match(catalogService, /'location\.address'/);
  assert.match(catalogService, /'location\.settlement'/);
  assert.match(catalogService, /'location\.region'/);
  assert.match(catalogService, /query\.settlement \?\? query\.city/);
  assert.match(catalogService, /query\.region/);

  assert.match(schemaSource, /settlement:\s*sharedSearchSchema/);
  assert.match(schemaSource, /region:\s*sharedSearchSchema/);
});

//===================================================================

test('Stage 13.4.5 public pharmacy details expose canonical structured location', async () => {
  const [serviceSource, typeSource] = await Promise.all([
    read('src/services/pharmacy.service.ts'),
    read('src/types/pharmacy.ts'),
  ]);

  const serializer = serviceSource.slice(
    serviceSource.indexOf('function serializePublicPharmacy'),
    serviceSource.indexOf('function serializeCurrentPharmacySummary')
  );

  const publicDto = typeSource.slice(
    typeSource.indexOf('export type PublicPharmacyResponseDto'),
    typeSource.indexOf('export type PharmacyReviewResponseDto')
  );

  assert.match(serializer, /location:\s*\{/);
  assert.match(serializer, /settlement:\s*pharmacy\.location\.settlement/);
  assert.match(serializer, /region:\s*pharmacy\.location\.region/);
  assert.match(serializer, /address:\s*pharmacy\.location\.address/);

  assert.doesNotMatch(
    serializer,
    /\{\s*city:\s*pharmacy\.location\.settlement\s*\}/
  );

  assert.match(publicDto, /location\?:\s*PharmacyLocationDraft/);
  assert.doesNotMatch(publicDto, /\baddress\?:/);
  assert.doesNotMatch(publicDto, /\bcity\?:/);
});
