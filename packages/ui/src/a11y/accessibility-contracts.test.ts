import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

//===================================================================

async function readSource(path: string) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

//===================================================================

test('modal foundation requires a real accessible name', async () => {
  const source = await readSource('../overlays/ModalBase/ModalBase.tsx');
  assert.match(source, /labelledBy: string/);
  assert.match(source, /ariaLabel: string/);
  assert.doesNotMatch(source, /fallbackTitleId/);
});

//===================================================================

test('working hours are exposed as a labelled field group', async () => {
  const source = await readSource(
    '../../../../apps/pharmacy/src/components/profile/WorkingHoursInput/WorkingHoursInput.tsx'
  );

  assert.match(source, /<fieldset/);
  assert.match(source, /<legend/);
  assert.match(source, /opening time/);
  assert.match(source, /closing time/);
});

//===================================================================

test('data table preserves consumer order and alignment classes are truthful', async () => {
  const component = await readSource('../data-display/DataTable/DataTable.tsx');
  const styles = await readSource(
    '../data-display/DataTable/DataTable.module.css'
  );
  assert.doesNotMatch(component, /newestFirst|getSortDateValue/);
  assert.match(styles, /\.alignRight\s*\{[\s\S]*?text-align:\s*right/);
  assert.match(styles, /\.alignCenter\s*\{[\s\S]*?text-align:\s*center/);
});

//===================================================================

test('overlay foundation coordinates stacked dialogs through one UI-owned manager', async () => {
  const manager = await readSource('../internal/overlay/overlay-manager.ts');
  const modal = await readSource('../overlays/ModalBase/ModalBase.tsx');

  assert.match(manager, /const overlayStack: OverlayEntry\[\]/);
  assert.match(manager, /getTopOverlay/);
  assert.match(manager, /event\.defaultPrevented/);

  assert.match(
    manager,
    /document\.addEventListener\('keydown', handleDocumentKeyDown\)/
  );

  assert.doesNotMatch(manager, /handleDocumentKeyDown, true/);
  assert.match(manager, /window\.cancelAnimationFrame/);
  assert.match(modal, /useOverlayLayer/);
  assert.match(modal, /useBackdropPointer/);
});

//===================================================================

test('date filter uses business calendar dates and synchronizes draft state', async () => {
  const source = await readSource('../forms/DateFilter/DateFilter.tsx');

  assert.match(source, /getBusinessCalendarDate/);
  assert.match(source, /const valueFrom = value\.from/);
  assert.match(source, /const valueTo = value\.to/);
  assert.match(source, /setDraftValue\(\{ from: valueFrom, to: valueTo \}\)/);
  assert.match(source, /\[valueFrom, valueTo\]/);
  assert.doesNotMatch(source, /toISOString\(\)\.slice\(0, 10\)/);
  assert.doesNotMatch(source, /aria-describedby=\{applyButtonId\}/);
});

//===================================================================

test('select foundations expose safe option ids and complete navigation keys', async () => {
  const select = await readSource('../forms/SelectField/SelectField.tsx');
  const searchable = await readSource(
    '../forms/SearchableSelect/SearchableSelect.tsx'
  );

  for (const source of [select, searchable]) {
    assert.match(source, /option-\$\{index\}/);
    assert.match(source, /ArrowDown/);
    assert.match(source, /ArrowUp/);
    assert.match(source, /Home/);
    assert.match(source, /End/);
    assert.match(source, /scrollIntoView/);
    assert.match(source, /aria-activedescendant/);
  }
});

//===================================================================

test('document upload delegates file rules to validation and exposes a labelled input', async () => {
  const source = await readSource('../forms/DocumentUpload/DocumentUpload.tsx');

  assert.match(source, /validateSelection/);
  assert.match(source, /<label className=\{css\.label\} htmlFor=\{id\}>/);
  assert.match(source, /required=\{required\}/);
  assert.match(source, /aria-errormessage/);
  assert.doesNotMatch(source, /type DocumentUploadFile/);
});

//===================================================================

test('status pages have one image API and truthful image semantics', async () => {
  const layout = await readSource(
    '../status-pages/StatusPageLayout/StatusPageLayout.tsx'
  );

  const errorPage = await readSource('../status-pages/ErrorPage/ErrorPage.tsx');
  const notFoundPage = await readSource(
    '../status-pages/NotFoundPage/NotFoundPage.tsx'
  );

  for (const source of [layout, errorPage, notFoundPage]) {
    assert.doesNotMatch(source, /imageSrc/);
    assert.doesNotMatch(source, /(error|not-found|status-page)-title/);
  }

  assert.match(layout, /imageIsDecorative/);
  assert.match(layout, /aria-hidden=\{imageIsDecorative \|\| undefined\}/);
  assert.match(layout, /alt=\{image\.alt \?\? ''\}/);
});

//===================================================================

test('sales chart provides keyboard navigation, values, summary, and a data table', async () => {
  const source = await readSource(
    '../../../../apps/pharmacy/src/components/sales/SalesValueChart/SalesValueChart.tsx'
  );

  assert.doesNotMatch(source, /role="img"/);
  assert.match(source, /role="group"/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /ArrowRight/);
  assert.match(source, /getPointAriaLabel/);
  assert.match(source, /<table/);
  assert.match(source, /<caption>/);
  assert.match(source, /View sales data table/);
});

//===================================================================

test('public UI folders contain implementations rather than legacy forwarding barrels', async () => {
  const entrypoints = await Promise.all([
    readSource('../cabinet/index.ts'),
    readSource('../data-display/index.ts'),
    readSource('../forms/index.ts'),
    readSource('../media/index.ts'),
    readSource('../navigation/index.ts'),
    readSource('../overlays/index.ts'),
    readSource('../primitives/index.ts'),
  ]);

  for (const source of entrypoints) {
    assert.doesNotMatch(source, /export \* from '\.\.\//);
  }
});

//===================================================================

test('icon controls share one accessible IconButton primitive', async () => {
  const iconButton = await readSource(
    '../primitives/IconButton/IconButton.tsx'
  );

  const closeButton = await readSource(
    '../primitives/CloseIconButton/CloseIconButton.tsx'
  );

  const burgerButton = await readSource(
    '../cabinet/BurgerButton/BurgerButton.tsx'
  );

  assert.match(iconButton, /label: string/);
  assert.match(iconButton, /aria-label=\{label\}/);
  assert.match(closeButton, /<IconButton/);
  assert.match(burgerButton, /<IconButton/);
});

//===================================================================

test('component names and physical placement describe their actual responsibility', async () => {
  const primitives = await readSource('../primitives/index.ts');
  const navigation = await readSource('../navigation/index.ts');
  const forms = await readSource('../forms/index.ts');

  const pharmacyWorkingHours = await readSource(
    '../../../../apps/pharmacy/src/components/profile/WorkingHoursInput/WorkingHoursInput.tsx'
  );

  assert.doesNotMatch(primitives, /LinkButton|ButtonLink/);
  assert.match(navigation, /LinkButton/);
  assert.match(forms, /MarkdownTextarea/);
  assert.doesNotMatch(forms, /TextEditor|WorkingHoursInput/);
  assert.match(pharmacyWorkingHours, /parseWorkingHoursValue/);
});
