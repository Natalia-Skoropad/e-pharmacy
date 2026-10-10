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
  assert.match(history, /item\.changedFields\.length > 3/);
  assert.match(history, /\+\{item\.changedFields\.length - 3\} more changes/);

  assert.match(
    history,
    /render: \(item\) => <span>\{item\.entityLabelSnapshot\}<\/span>/
  );

  assert.match(history, /buildAdminActivityUrl/);
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
  assert.match(modal, /getAdminAuditFieldLabel/);
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
