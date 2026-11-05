import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

//===================================================================

// Resolve the monorepo root independent of pnpm/turbo's package cwd.
const root = fileURLToPath(new URL('../../../../../', import.meta.url));

//===================================================================

const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

//===================================================================

test('owner action menu constrains dropdown width and leaves no phantom tooltip gap', () => {
  const css = read(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.module.css'
  );

  const actions = read(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  assert.match(css, /\.statusMenuOptions\s*\{[^}]*width:\s*100%/);
  assert.match(css, /\.statusMenuOptions\s*\{[^}]*max-width:\s*100%/);

  assert.match(
    css,
    /\.statusActionRow\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/
  );

  assert.match(
    css,
    /\.statusActionRow:not\(:has\(\.statusActionTooltip\)\)\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/
  );

  assert.match(css, /\.statusActionTooltip\s*\{[^}]*display:\s*inline-flex/);
  assert.match(actions, /disabled && disabledReason \? \(/);
});

//===================================================================

test('Admin pharmacy owner linked list carries reviewState and renders the neutral badge', () => {
  const type = read('packages/types/src/admin/pharmacy-owner.ts');

  const service = read(
    'apps/api/src/services/admin/owners/admin-pharmacy-owner-pharmacies.service.ts'
  );

  const parser = read(
    'apps/admin/src/lib/pharmacy-owners/admin-pharmacy-owner.ts'
  );

  const table = read(
    'apps/admin/src/components/pharmacy-owners/PharmacyOwnerDetailsPageContent/LinkedPharmaciesTable.tsx'
  );

  assert.match(type, /reviewState\?: 'pending' \| 'changes_requested'/);
  assert.match(service, /reviewState: pharmacy\.reviewState/);
  assert.match(parser, /record\.reviewState === 'changes_requested'/);
  assert.match(table, /pharmacy\.reviewState === 'changes_requested'/);
  assert.match(table, /StatusBadge label="Needs changes" tone="neutral"/);
});
