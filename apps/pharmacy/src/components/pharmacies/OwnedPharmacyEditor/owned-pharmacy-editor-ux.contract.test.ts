import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const editor = readFileSync(
  new URL('./OwnedPharmacyEditor.tsx', import.meta.url),
  'utf8'
);

const styles = readFileSync(
  new URL('./OwnedPharmacyEditor.module.css', import.meta.url),
  'utf8'
);

const fields = readFileSync(
  new URL('./pharmacy-editor-fields.ts', import.meta.url),
  'utf8'
);

//===================================================================

test('one Save draft action lives beside the page title, with mobile stacked actions', () => {
  assert.equal((editor.match(/>\s*Save draft\s*</g) ?? []).length, 1);

  assert.match(
    editor,
    /<PageHeader[\s\S]*?actions=\{[\s\S]*?Save draft[\s\S]*?<Tabs/
  );

  assert.match(
    styles,
    /\.editorHeader\s*>\s*:last-child\s*\{[^}]*justify-self:\s*end/
  );

  assert.match(styles, /@media only screen and \(max-width: 767px\)/);
  assert.match(styles, /\.headerActions\s*>\s*button\s*\{[^}]*width:\s*100%/);

  assert.doesNotMatch(
    editor,
    /Back to pharmacies|Unsaved changes|Complete all four tabs/
  );
});

//===================================================================

test('editor uses existing shared tab, section, image, document and form components', () => {
  for (const component of [
    'Tabs',
    'PageHeader',
    'ProfileSectionHeader',
    'PictureCard',
    'DocumentsPanel',
    'PharmacyAboutFields',
    'PharmacyPaymentFields',
    'CommentInput',
    'WorkingHoursInput',
    'InfoTooltip',
  ]) {
    assert.match(editor, new RegExp(`<${component}\\b`));
  }

  assert.doesNotMatch(
    editor,
    /<nav className=\{css\.tabs\}|<textarea|type="file"/
  );
});

//===================================================================

test('pharmacy data has three vertically separated sections and canonical input hints/counters', () => {
  for (const title of ['Pharmacy information', 'Working hours']) {
    assert.match(editor, new RegExp(`title="${title}"`));
  }

  assert.match(
    editor,
    /Pharmacy photo <span className=\{css\.required\}>\*<\/span>/
  );

  assert.match(
    styles,
    /\.profileBlock\s*\+\s*\.profileBlock\s*\{[^}]*border-top:/
  );

  assert.match(
    editor,
    /tab === 'data'[\s\S]*?<CommentInput[\s\S]*?name="shortDescription"/
  );

  assert.match(fields, /data: \[\s*'name',\s*'shortDescription',/);

  assert.match(
    editor,
    /input\('region'[\s\S]*input\('settlement'[\s\S]*css\.fullWidth[\s\S]*input\('address'/
  );

  assert.match(
    editor,
    /input\('phone', \{ maxLength: USER_PHONE_MAX_LENGTH \}\)/
  );

  assert.match(
    editor,
    /input\('email', \{ maxLength: USER_EMAIL_MAX_LENGTH \}\)/
  );

  assert.match(editor, /hint: FIELD_HINTS\[name\]/);
  assert.doesNotMatch(editor, /groupTitle|Contact information|>Location</);
});

//===================================================================

test('documents tab is hidden before saving a pharmacy and editable once the draft exists', () => {
  assert.match(
    editor,
    /const visibleTabs = hasSavedDraft[\s\S]*?filter\(\(item\) => item\.value !== 'documents'\)/
  );

  assert.match(editor, /items=\{visibleTabs\}/);
  assert.match(editor, /onChange=\{\(selection\) =>/);
  assert.match(editor, /disabled=\{busy !== null\}/);
  assert.match(editor, /onDownloadFile=\{async \(file\) =>/);

  assert.match(
    editor,
    /downloadOwnedPharmacyDocument\(pharmacyId, file\.documentId\)/
  );

  assert.doesNotMatch(
    editor,
    /Save the pharmacy draft first|Owner documents:\s*<a|Pharmacy documents <span/
  );
});
