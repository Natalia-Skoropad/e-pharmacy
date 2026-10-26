import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('generic public pharmacy details expose availability but never payment credentials', async () => {
  const [serviceSource, typeSource] = await Promise.all([
    readFile(
      resolve(
        process.cwd(),
        'src/services/pharmacies/pharmacy-public-catalog.service.ts'
      ),
      'utf8'
    ),

    readFile(resolve(process.cwd(), 'src/types/pharmacies/pharmacy.ts'), 'utf8'),
  ]);

  const publicSerializer = serviceSource.slice(
    serviceSource.indexOf('function serializePublicPharmacy'),
    serviceSource.indexOf('export async function getPharmacyFiltersService')
  );

  const publicDto = typeSource.slice(
    typeSource.indexOf('export type PublicPharmacyResponseDto'),
    typeSource.indexOf('export type PharmacyReviewResponseDto')
  );

  assert.match(publicSerializer, /bankTransferAvailable/);
  assert.doesNotMatch(publicSerializer, /bankDetails:/);
  assert.match(publicDto, /bankTransferAvailable:\s*boolean/);
  assert.doesNotMatch(publicDto, /bankDetails\?:/);
});

//===================================================================

test('complete bank details remain owned by the authenticated checkout endpoint', async () => {
  const [serviceSource, routeSource] = await Promise.all([
    readFile(
      resolve(
        process.cwd(),
        'src/services/pharmacies/pharmacy-public-catalog.service.ts'
      ),
      'utf8'
    ),

    readFile(resolve(process.cwd(), 'src/routes/pharmacies/pharmacy.routes.ts'), 'utf8'),
  ]);

  const checkoutService = serviceSource.slice(
    serviceSource.indexOf(
      'export async function getPharmacyCheckoutDetailsService'
    ),

    serviceSource.indexOf('export async function setFavoritePharmacyService')
  );

  assert.match(checkoutService, /bankDetails/);
  assert.match(checkoutService, /hasCompleteBankDetails/);

  assert.match(
    routeSource,
    /'\/:pharmacyId\/checkout-details'[\s\S]*?authenticate[\s\S]*?authorizeRoles\(USER_ROLES\.CLIENT, USER_ROLES\.PHARMACY, USER_ROLES\.ADMIN\)/
  );
});
