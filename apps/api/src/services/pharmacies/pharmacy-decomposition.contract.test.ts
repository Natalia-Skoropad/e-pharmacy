import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// S10.2: architecture and behavior guardrails for the pharmacy service split.
const src = resolve(process.cwd(), 'src');
const services = resolve(src, 'services/pharmacies');

const read = (file: string): string =>
  readFileSync(resolve(services, file), 'utf8');

const modules = [
  'pharmacy-public-status',
  'pharmacy-public-catalog.service',
  'pharmacy-reviews.service',
  'pharmacy-profile.shared',
  'pharmacy-owner-profile.service',
  'pharmacy-moderation.service',
] as const;

//===============================================================

test('S10.2 removes the old service without proxy/barrel and controllers import direct domain modules', () => {
  assert.equal(existsSync(resolve(services, 'pharmacy.service.ts')), false);

  const controller = readFileSync(
    resolve(src, 'controllers/pharmacy.controller.ts'),
    'utf8'
  );

  for (const name of [
    'pharmacy-public-catalog.service',
    'pharmacy-reviews.service',
    'pharmacy-owner-profile.service',
    'pharmacy-moderation.service',
  ]) {
    assert.match(
      controller,
      new RegExp(`from ['"]\\.\\./services/pharmacies/${name}['"]`)
    );
  }

  assert.doesNotMatch(controller, /\/pharmacy\.service['"]/);

  for (const module of modules) {
    const source = read(`${module}.ts`);

    assert.doesNotMatch(source, /export\s*\*\s*from|export\s*\{[^}]*\}\s*from/);

    assert.match(
      source,
      /(?:export\s+(?:async\s+function|function|const|type)\s+)/
    );
  }
});

//===============================================================

test('S10.2 canonical modules form a directed acyclic import graph with existing local targets', () => {
  const adjacency = new Map<string, string[]>();
  const names = new Set<string>(modules);

  for (const name of modules) {
    const code = read(`${name}.ts`);

    const imports = [...code.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)].map(
      (match) => match[1]
    );

    for (const dependency of imports) {
      assert.ok(
        existsSync(resolve(services, `${dependency}.ts`)),
        `${name} -> ${dependency} is missing`
      );
    }

    adjacency.set(
      name,
      imports.filter((name) => names.has(name))
    );
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(name: string): void {
    assert.equal(visiting.has(name), false, `Circular dependency at ${name}`);

    if (visited.has(name)) return;

    visiting.add(name);

    for (const dependency of adjacency.get(name) ?? []) visit(dependency);

    visiting.delete(name);
    visited.add(name);
  }

  for (const name of modules) visit(name);
});

//===============================================================

test('S10.2 preserves public visibility, review moderation and duplicate-key semantics', () => {
  const publicStatus = read('pharmacy-public-status.ts');
  const catalog = read('pharmacy-public-catalog.service.ts');
  const reviews = read('pharmacy-reviews.service.ts');

  assert.match(publicStatus, /PHARMACY_STATUSES\.ACTIVE/);
  assert.match(publicStatus, /PHARMACY_STATUSES\.ON_MODERATION/);

  assert.match(
    catalog,
    /bankTransferAvailable: hasCompleteBankDetails\(pharmacy\.bankDetails\)/
  );

  assert.doesNotMatch(
    catalog
      .split('function serializePublicPharmacy')[1]
      .split('function serializeCurrentPharmacySummary')[0]
      .split('export async function getPharmacyFiltersService')[0],
    /bankDetails:\s*pharmacy\.bankDetails/
  );

  assert.match(reviews, /isDuplicatePharmacyReviewError\(error\)/);
  assert.match(reviews, /REVIEW_ERROR_CODES\.ALREADY_SUBMITTED/);

  assert.match(
    reviews,
    /Pharmacy\.updateOne\([\s\S]*?reviewsCount: approved\.length/
  );
});

//===============================================================

test('S10.2 keeps owner/manager privacy, explicit membership, CAS and audit within transactions', () => {
  const shared = read('pharmacy-profile.shared.ts');
  const owner = read('pharmacy-owner-profile.service.ts');
  const moderation = read('pharmacy-moderation.service.ts');

  assert.match(shared, /membershipRole !== 'manager' && pharmacy\.bankDetails/);

  assert.match(
    shared,
    /membershipRole !== 'manager' && pharmacy\.pendingModeration/
  );

  assert.match(owner, /'edit_profile',\s*mongoSession,\s*pharmacyId/);
  assert.match(owner, /mongoSession\.withTransaction/);
  assert.match(owner, /updatedAt: new Date\(expectedRevision\)/);
  assert.match(moderation, /'submit_profile',\s*session,\s*pharmacyId/);
  assert.match(moderation, /mongoSession\.withTransaction/);
  assert.match(moderation, /session\.withTransaction/);
  assert.match(moderation, /PharmacyOwnerDocument\.exists/);
  assert.match(shared, /appendAdminAuditLog\([\s\S]*?session,/);

  assert.doesNotMatch(
    shared,
    /before:\s*\{\s*bankDetails|after:\s*\{\s*documents/
  );
});
