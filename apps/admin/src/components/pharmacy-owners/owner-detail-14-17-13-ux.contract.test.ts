import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relativePath: string): string =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('admin profile breadcrumbs retain the leading icon on sub-tabs', () => {
  const header = read('../layout/AdminHeader/AdminHeader.tsx');

  assert.match(header, /pathname === ADMIN_ROUTES\.PROFILE\s*\|\|/);

  assert.match(
    header,
    /pathname\.startsWith\(`\$\{ADMIN_ROUTES\.PROFILE\}\/`\)/
  );

  assert.match(header, /<UserRound size=\{20\} aria-hidden="true"/);
});

//===================================================================

test('owner email and phone reserve an independent column for the copy action', () => {
  const detail = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.tsx'
  );

  const styles = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.module.css'
  );

  assert.match(
    detail,
    /<Mail size=\{17\} aria-hidden="true"\s*\/>\s*<a\s+className=\{css\.contactText\}/
  );

  assert.match(
    detail,
    /<Phone size=\{17\} aria-hidden="true"\s*\/>\s*<a\s+className=\{css\.contactText\}/
  );

  assert.equal((detail.match(/<CopyButton/g) ?? []).length, 2);

  assert.match(styles, /\.contactValue\s*\{[^}]*display: grid;/s);
  assert.match(styles, /grid-template-columns:\s*17px minmax\(0, 1fr\) auto;/);

  assert.match(
    styles,
    /\.detailsList a\.contactText\s*\{[^}]*overflow-wrap: anywhere;/s
  );
});

//===================================================================

test('linked pharmacy order metrics uses a floating tooltip with hover and focus triggers', () => {
  const table = read(
    './PharmacyOwnerDetailsPageContent/LinkedPharmaciesTable.tsx'
  );

  const styles = read(
    './PharmacyOwnerDetailsPageContent/PharmacyOwnerDetailsPageContent.module.css'
  );

  const tooltip = read(
    '../../../../../packages/ui/src/overlays/InfoTooltip/InfoTooltip.tsx'
  );

  const metrics = read(
    '../../../../../packages/ui/src/overlays/OrderMetricsTooltip/OrderMetricsTooltip.tsx'
  );

  assert.match(table, /<OrderMetricsTooltip scope="pharmacy"/);
  assert.match(metrics, /escapeOverflow/);
  assert.match(styles, /\.tableHeaderWithHelp button\s*\{[^}]*width: 24px;/s);
  assert.match(tooltip, /onPointerEnter=\{showFloatingTooltip\}/);
  assert.match(tooltip, /onMouseEnter=\{showFloatingTooltip\}/);
  assert.match(tooltip, /onFocus=\{showFloatingTooltip\}/);
  assert.match(tooltip, /createPortal\(tooltipContent, document\.body\)/);
});
