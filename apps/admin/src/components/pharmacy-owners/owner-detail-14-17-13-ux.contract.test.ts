import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relativePath: string): string =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

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

  assert.match(styles, /\.contactValue\s*\{[^}]*display: grid;/);
  assert.match(styles, /grid-template-columns:\s*17px minmax\(0, 1fr\) auto;/);

  assert.match(
    styles,
    /\.detailsList a\.contactText\s*\{[^}]*overflow-wrap: anywhere;/
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
  assert.match(styles, /\.tableHeaderWithHelp button\s*\{[^}]*width: 24px;/);
  assert.match(tooltip, /onPointerEnter=\{showFloatingTooltip\}/);
  assert.match(tooltip, /onMouseEnter=\{showFloatingTooltip\}/);

  // Normal tooltips remain keyboard-focusable. Long scrollable tooltips
  // use click-to-pin instead of reopening during focus transitions.
  assert.match(
    tooltip,
    /onFocus=\{scrollable \? undefined : showFloatingTooltip\}/
  );

  assert.match(
    tooltip,
    /onFocusCapture=\{scrollable \? undefined : showFloatingTooltip\}/
  );

  assert.match(tooltip, /createPortal\(tooltipContent, document\.body\)/);
});
