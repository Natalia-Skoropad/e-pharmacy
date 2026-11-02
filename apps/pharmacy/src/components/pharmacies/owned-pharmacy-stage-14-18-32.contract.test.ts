import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const root = process.cwd().endsWith('apps/pharmacy')
  ? path.resolve(process.cwd(), '../..')
  : process.cwd();

const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

//===================================================================

test('owner action menu preserves no-wrap status buttons beside disabled action tooltip', () => {
  const css = read(
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.module.css'
  );

  assert.match(
    css,
    /\.statusActionRow > button\s*\{[^}]*white-space:\s*nowrap/
  );

  assert.match(css, /\.statusMenuOptions\s*\{[^}]*width:\s*max-content/);
  assert.match(css, /\.statusActionTooltip\s*\{[^}]*flex-shrink:\s*0/);
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
