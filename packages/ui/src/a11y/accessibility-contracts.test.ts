import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

//===================================================================

async function readSource(path: string) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

//===================================================================

test('modal foundation requires a real accessible name', async () => {
  const source = await readSource('../modals/ModalBase/ModalBase.tsx');
  assert.match(source, /labelledBy: string/);
  assert.match(source, /ariaLabel: string/);
  assert.doesNotMatch(source, /fallbackTitleId/);
});

//===================================================================

test('working hours are exposed as a labelled field group', async () => {
  const source = await readSource(
    '../common/WorkingHoursInput/WorkingHoursInput.tsx'
  );

  assert.match(source, /<fieldset/);
  assert.match(source, /<legend/);
  assert.match(source, /opening time/);
  assert.match(source, /closing time/);
});

//===================================================================

test('data table preserves consumer order and alignment classes are truthful', async () => {
  const component = await readSource('../common/DataTable/DataTable.tsx');
  const styles = await readSource('../common/DataTable/DataTable.module.css');
  assert.doesNotMatch(component, /newestFirst|getSortDateValue/);
  assert.match(styles, /\.alignRight\s*\{[\s\S]*?text-align:\s*right/);
  assert.match(styles, /\.alignCenter\s*\{[\s\S]*?text-align:\s*center/);
});

//===================================================================

test('overlay foundation coordinates stacked dialogs through one manager', async () => {
  const hook = await readSource('../../../hooks/src/dom/useOverlayLayer.ts');
  const modal = await readSource('../modals/ModalBase/ModalBase.tsx');

  assert.match(hook, /const overlayStack: OverlayEntry\[\]/);
  assert.match(hook, /getTopOverlay/);
  assert.match(hook, /overlayStack\.length === 0/);

  assert.match(
    hook,
    /document\.addEventListener\('keydown', handleDocumentKeyDown, true\)/
  );

  assert.match(hook, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(modal, /useOverlayLayer/);
});

//===================================================================

test('date filter uses business calendar dates and synchronizes draft state', async () => {
  const source = await readSource('../common/DateFilter/DateFilter.tsx');

  assert.match(source, /getBusinessCalendarDate/);
  assert.match(source, /setDraftValue\(value\)/);
  assert.doesNotMatch(source, /toISOString\(\)\.slice\(0, 10\)/);
  assert.doesNotMatch(source, /aria-describedby=\{applyButtonId\}/);
});

//===================================================================

test('select foundations expose safe option ids and complete navigation keys', async () => {
  const select = await readSource('../common/SelectField/SelectField.tsx');
  const searchable = await readSource(
    '../common/SearchableSelect/SearchableSelect.tsx'
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
