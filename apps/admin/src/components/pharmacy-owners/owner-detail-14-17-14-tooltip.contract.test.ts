import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relativePath: string): string =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('linked pharmacies is the only order metrics table opting into browser top layer', () => {
  const ownerTable = read(
    './PharmacyOwnerDetailsPageContent/LinkedPharmaciesTable.tsx'
  );

  const registry = read(
    '../pharmacies/PharmaciesPageContent/PharmaciesPageContent.tsx'
  );

  const metrics = read(
    '../../../../../packages/ui/src/overlays/OrderMetricsTooltip/OrderMetricsTooltip.tsx'
  );

  assert.match(
    ownerTable,
    /<OrderMetricsTooltip scope="pharmacy" preferTopLayer\s*\/>/
  );

  assert.match(registry, /<OrderMetricsTooltip scope="pharmacy"\s*\/>/);
  assert.match(metrics, /preferTopLayer=\{preferTopLayer\}/);
});

//===================================================================

test('native popover is mounted in body and opened when the hover state changes', () => {
  const tooltip = read(
    '../../../../../packages/ui/src/overlays/InfoTooltip/InfoTooltip.tsx'
  );

  const css = read(
    '../../../../../packages/ui/src/overlays/InfoTooltip/InfoTooltip.module.css'
  );

  assert.match(
    tooltip,
    /popover=\{escapeOverflow && preferTopLayer \? 'manual' : undefined\}/
  );

  assert.match(tooltip, /tooltip\.showPopover\(\)/);
  assert.match(tooltip, /createPortal\(tooltipContent, document\.body\)/);
  assert.match(tooltip, /onPointerEnter=\{showFloatingTooltip\}/);
  assert.match(tooltip, /onMouseLeave=\{hideFloatingTooltip\}/);

  assert.match(
    css,
    /\.floatingTooltipTopLayer\[popover\]:not\(:popover-open\)\s*\{[^}]*display: none;/s
  );
});
