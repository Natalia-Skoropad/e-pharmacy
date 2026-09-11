import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

//===================================================================

async function read(relativePath) {
  return readFile(new URL(`../../../${relativePath}`, import.meta.url), 'utf8');
}

//===================================================================

const [
  rootLayout,
  pharmacyShell,
  authProvider,
  pharmacyProfileProvider,
  pharmacyProfilePage,
  orderDetailsPage,
  pharmacySummaryRoute,
] = await Promise.all([
  read('apps/pharmacy/src/app/layout.tsx'),
  read('apps/pharmacy/src/components/layout/PharmacyShell/PharmacyShell.tsx'),
  read('apps/pharmacy/src/providers/AuthProvider/AuthProvider.tsx'),

  read(
    'apps/pharmacy/src/providers/PharmacyProfileProvider/PharmacyProfileProvider.tsx'
  ),

  read(
    'apps/pharmacy/src/components/profile/PharmacyProfilePageContent/PharmacyProfilePageContent.tsx'
  ),

  read(
    'apps/pharmacy/src/components/orders/OrderDetailsPageContent/OrderDetailsPageContent.tsx'
  ),

  read('apps/pharmacy/src/app/api/pharmacies/me/summary/route.ts'),
]);

assert.match(
  rootLayout,
  /<AuthProvider>[\s\S]*\{children\}[\s\S]*<\/AuthProvider>/
);

assert.match(
  pharmacyShell,
  /<PharmacyProtectedRoute>[\s\S]*<PharmacyProfileProvider>[\s\S]*\{children\}[\s\S]*<\/PharmacyProfileProvider>[\s\S]*<\/PharmacyProtectedRoute>/
);

assert.match(authProvider, /from '@e-pharmacy\/auth\/react'/);
assert.match(authProvider, /from '@\/lib\/api\/browser\/auth\.api'/);
assert.doesNotMatch(authProvider, /from '@\/lib\/api\/browser'/);

assert.match(pharmacyProfileProvider, /useAuth/);

assert.match(
  pharmacyProfileProvider,
  /from '@\/lib\/api\/browser\/pharmacy\.api'/
);

assert.doesNotMatch(pharmacyProfileProvider, /from '@\/lib\/api\/browser'/);

assert.match(pharmacyProfileProvider, /getCurrentPharmacySummary/);
assert.doesNotMatch(pharmacyProfileProvider, /getMyPharmacyProfile/);

assert.doesNotMatch(
  pharmacyProfileProvider,
  /bankDetails|documents|pendingModeration/
);

assert.match(pharmacyProfilePage, /getMyPharmacyProfile/);
assert.match(orderDetailsPage, /getPharmacyCheckoutDetails/);
assert.doesNotMatch(orderDetailsPage, /pharmacyProfile\.bankDetails/);

assert.match(pharmacySummaryRoute, /createPrivateProxyRoute/);
assert.match(pharmacySummaryRoute, /API_ROUTES\.pharmacies\.mySummary/);

for (const [label, source] of [
  ['AuthProvider', authProvider],
  ['PharmacyProfileProvider', pharmacyProfileProvider],
]) {
  assert.doesNotMatch(source, /accessToken|refreshToken/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(source, /API_BASE_URL|BACKEND_URL/);
}

console.log(
  'Pharmacy provider check passed (Auth → protected pharmacy profile summary ownership, same-origin browser APIs, no token/private persistence).'
);
