import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const source = (filename: string) =>
  readFile(new URL(filename, import.meta.url), 'utf8');

//===================================================================

test('activity list and filters use the same section and change names', async () => {
  const [history, filters] = await Promise.all([
    source('./ActivityHistory.tsx'),
    source('./ActivityFiltersDrawer.tsx'),
  ]);

  assert.match(history, /parts=\{\['Changed', 'type'\]\}/);
  assert.match(history, /parts=\{\['Section', 'name'\]\}/);
  assert.match(history, /parts=\{\['Changed', 'fields'\]\}/);
  assert.match(filters, /label="Section name"/);
  assert.match(filters, /section !== 'profile'/);
  assert.match(history, /\.slice\(0, 3\)\s*\.map\(getAdminAuditFieldLabel\)/);
  assert.match(history, /changedFields\.length > 3/);
  assert.match(history, /\+\{changedFields\.length - 3\} more changes/);

  assert.match(
    history,
    /className=\{css\.breakableEntity\}>\{item\.entityLabelSnapshot\}<\/span>/
  );

  assert.match(history, /buildAdminActivityUrl/);
  assert.match(history, /field !== 'revision'/);
  assert.match(history, /field !== 'editedSections'/);
});

//===================================================================

test('audit modal separates section and page and has accessible change values', async () => {
  const [modal, presentation, styles] = await Promise.all([
    source('./AuditDetailsModal.tsx'),
    source('../../lib/audit/admin-audit-presentation.ts'),
    source('./ActivityHistory.module.css'),
  ]);

  assert.match(modal, /Link to section/);
  assert.match(modal, /Link to page/);
  assert.match(modal, /<ActivitySectionLink item=\{details\} \/>/);
  assert.match(modal, /<ActivityPageLink/);
  assert.match(modal, /getAdminAuditChangedFieldLabel/);
  assert.match(modal, /getAuditColorSwatch/);
  assert.match(modal, /<StatusBadge/);
  assert.match(modal, /Reason \/ description/);
  assert.match(presentation, /getAdminAuditPageLocation/);

  const sectionLink = await source('./ActivitySectionLink.tsx');

  assert.match(sectionLink, /className=\{css\.actorIdentityNameLink\}/);

  assert.match(
    sectionLink,
    /<span className=\{css\.sectionIcon\} aria-hidden="true">/
  );

  assert.match(sectionLink, /<TextActionButton/);
  assert.match(styles, /\.actorIdentityNameLink \{/);
  assert.doesNotMatch(styles, /\.sectionLink:hover \.sectionLinkLabel/);
});

//===================================================================

test('audit photo previews use an explicit historical before URL and shimmer while loading', async () => {
  const modal = await source('./AuditDetailsModal.tsx');

  assert.match(modal, /<ShimmerImage/);
  assert.match(modal, /photoUrl=\{item\.beforePhotoUrl\}/);
  assert.match(modal, /photoUrl=\{item\.afterPhotoUrl\}/);
  assert.match(modal, /Historical photo preview unavailable/);
  assert.doesNotMatch(modal, /photoDigest\?\.url === pagePhotoUrl/);
  assert.doesNotMatch(modal, /item\.photoUrl/);
  assert.match(modal, /beforePhotoUrl/);
});
