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

  assert.match(history, /Change type/);
  assert.match(history, /title: 'Section name'/);
  assert.match(filters, /label="Section name"/);
  assert.match(filters, /section !== 'profile'/);
  assert.match(history, /getAdminAuditFieldsSummary/);

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

  assert.match(modal, /Section name/);
  assert.match(modal, /Page name/);
  assert.match(modal, /getAdminAuditFieldLabel/);
  assert.match(modal, /getAuditColorSwatch/);
  assert.match(modal, /<StatusBadge/);
  assert.match(modal, /Reason \/ description/);
  assert.match(presentation, /getAdminAuditPageLocation/);
  assert.match(styles, /\.sectionLink:hover \.sectionLinkLabel/);
});
