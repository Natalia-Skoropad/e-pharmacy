import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const component = readFileSync(
  new URL('./PharmacyProfilePageContent.tsx', import.meta.url),
  'utf8'
);

const route = readFileSync(
  new URL('../../../app/pharmacy/profile/[tab]/page.tsx', import.meta.url),
  'utf8'
);

const matcher = readFileSync(
  new URL('../../../lib/routes/pharmacy-routes.ts', import.meta.url),
  'utf8'
);

//===================================================================

test('pharmacy profile tabs are direct-linkable and preserve client draft state on switching', () => {
  assert.match(component, /usePathname/);
  assert.match(component, /window\.history\.pushState/);
  assert.match(component, /PHARMACY_ROUTES\.PROFILE/);

  for (const tab of [
    'pharmacy-data',
    'about',
    'payment',
    'documents',
    'reviews',
    'comments',
    'sessions',
  ]) {
    assert.match(route, new RegExp(`'${tab}'`));
  }

  assert.match(route, /notFound\(\)/);
  assert.match(matcher, /startsWith\(`\$\{PHARMACY_ROUTES\.PROFILE\}\/`\)/);
});

//===================================================================

test('documents tab badge preloads owner document count independently of tab content', () => {
  assert.match(
    component,
    /getMyPharmacyOwnerDocuments\(\{ signal: controller\.signal \}\)/
  );

  assert.match(
    component,
    /setOwnerDocumentsCount\(response\.documents\.length\)/
  );

  assert.match(
    component,
    /documentValues\.length \+ \(pharmacy\.membershipRole === 'owner' \? ownerDocumentsCount : 0\)/
  );
});
