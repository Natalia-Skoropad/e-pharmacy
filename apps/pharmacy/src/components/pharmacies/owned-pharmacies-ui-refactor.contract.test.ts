import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

//===================================================================

const editor = read('./OwnedPharmacyEditor/OwnedPharmacyEditor.tsx');

const editorTab = read(
  './OwnedPharmacyEditor/OwnedPharmacyEditorTabContent.tsx'
);

const guard = read('./OwnedPharmacyEditor/useUnsavedPharmacyNavigation.ts');

const editorStyles = read(
  './OwnedPharmacyEditor/OwnedPharmacyEditor.module.css'
);

const detail = read(
  './OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
);

const sidebar = read('../layout/PharmacySidebar/PharmacySidebar.tsx');

const hours = read('../profile/WorkingHoursInput/WorkingHoursInput.tsx');

const hourStyles = read(
  '../profile/WorkingHoursInput/WorkingHoursInput.module.css'
);

const payment = read(
  '../../../../../packages/ui/src/profile/PharmacyProfileFields.tsx'
);

const paymentStyles = read(
  '../../../../../packages/ui/src/profile/PharmacyProfileFields.module.css'
);

//===================================================================

test('owner sidebar counts are scoped, error-safe, refreshable and limited to three actionable statuses', () => {
  // Formatting may spread the options object across several lines.
  assert.match(
    sidebar,
    /getOwnedPharmacyStatistics\(\s*\{\s*signal:\s*controller\.signal\s*,?\s*\}\s*\)/
  );

  assert.match(sidebar, /subscribeToPharmacyCounterRefresh/);
  assert.match(sidebar, /activeController\?\.abort\(\)/);
  assert.match(sidebar, /generation !== version/);
  assert.match(sidebar, /setPharmacyCounts\(null\)/);

  for (const status of ['new', 'onVerification', 'onModeration']) {
    assert.match(sidebar, new RegExp(`pharmacyCounts\\.${status}`));
  }

  assert.doesNotMatch(
    sidebar,
    /pharmacyCounts\.active|pharmacyCounts\.blocked/
  );
});

//===================================================================

test('editor has in-card loader and tablet header actions without changing mobile behavior', () => {
  assert.match(editor, /<LoadingSpinner label="Preparing pharmacy\.\.\."/);
  assert.doesNotMatch(editor, /<PageLoader/);

  assert.match(
    editor,
    /<section className=\{css\.loadingCard\}>\s*<div className=\{css\.loaderBox\}>/
  );

  assert.match(
    editorStyles,
    /\.loadingCard\s*\{[\s\S]*?padding: 20px;[\s\S]*?border-radius: var\(--radius-xl\);/
  );

  assert.match(
    editorStyles,
    /\.loaderBox\s*\{[\s\S]*?gap: 16px;[\s\S]*?min-height: 280px;/
  );

  assert.match(editorStyles, /@media only screen and \(min-width: 768px\)/);
  assert.match(editorStyles, /grid-template-columns: minmax\(0, 1fr\) auto/);
  assert.match(editorStyles, /@media only screen and \(min-width: 1440px\)/);
});

//===================================================================

test('dirty draft warns on browser unload, and in-app navigation still uses branded confirmation', () => {
  assert.match(guard, /!isDirty \|\| allowNavigateRef\.current/);
  assert.match(guard, /addEventListener\('beforeunload'/);
  assert.match(guard, /event\.preventDefault\(\)/);
  assert.match(guard, /event\.returnValue = ''/);
  assert.match(guard, /removeEventListener\('beforeunload'/);
  assert.match(guard, /popstate/);
  assert.match(editor, /<ConfirmationModal/);
  assert.match(editor, /useUnsavedPharmacyNavigation\(isDirty\)/);
});

//===================================================================

test('working-hours errors are left aligned and use the shared design tokens', () => {
  assert.match(hours, /<CircleAlert size=\{16\}/);
  assert.match(hours, /role="alert"/);
  assert.match(hourStyles, /justify-content: flex-start/);
  assert.match(hourStyles, /text-align: left/);
  assert.match(hourStyles, /var\(--color-error\)/);
});

//===================================================================

test('payment descriptions are informative and paired controls align hint and input rows', () => {
  assert.match(payment, /registered taxpayer or company identification number/);
  assert.match(payment, /full official bank name/);
  assert.match(paymentStyles, /grid-row: span 3;/);
  assert.match(paymentStyles, /grid-template-rows: subgrid/);
  assert.doesNotMatch(paymentStyles, /grid-row: span 4;/);
});

//===================================================================

test('both large files use direct canonical submodules and preserve the public component contracts', () => {
  assert.match(editor, /<OwnedPharmacyEditorTabContent/);
  assert.match(editorTab, /<WorkingHoursInput/);
  assert.match(detail, /<DocumentsResource/);
  assert.match(detail, /<Information detail=\{detail\}/);
  assert.match(detail, /<About pharmacy=\{pharmacy\}/);
  assert.match(detail, /<Payment pharmacy=\{pharmacy\}/);

  assert.ok(editor.split('\n').length < 650);
  assert.ok(detail.split('\n').length < 650);
});
