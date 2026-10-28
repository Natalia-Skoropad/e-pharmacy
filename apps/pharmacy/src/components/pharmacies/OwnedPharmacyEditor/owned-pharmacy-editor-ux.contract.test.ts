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

const presentation = readFileSync(
  new URL('./OwnedPharmacyEditorTabContent.tsx', import.meta.url),
  'utf8'
);

const fields = readFileSync(
  new URL('./pharmacy-editor-fields.ts', import.meta.url),
  'utf8'
);

//===================================================================

test('one Save draft action lives beside the page title, with mobile stacked actions', () => {
  // Locate the actual button by its handler, regardless of JSX whitespace
  // or whether its label is wrapped by presentation markup.
  const draftSaveButtons =
    editor.match(
      /<Button\b(?:(?!<\/Button>)[\s\S])*?onClick=\{\s*\(\s*\)\s*=>\s*void\s+saveDraft\(\s*\)\s*\}[\s\S]*?<\/Button>/g
    ) ?? [];

  assert.equal(draftSaveButtons.length, 1);

  assert.doesNotMatch(
    editor,
    /<Button[\s\S]*?>\s*Send for verification\s*<\/Button>/
  );

  assert.match(draftSaveButtons[0]!, />\s*Save draft\s*<\/Button>/);

  assert.match(
    editor,
    /<PageHeader[\s\S]*?actions=\{[\s\S]*?onClick=\{\s*\(\s*\)\s*=>\s*void\s+saveDraft\(\s*\)\s*\}[\s\S]*?<Tabs/
  );

  assert.match(
    styles,
    /\.editorHeader\s*>\s*:last-child\s*\{[^}]*justify-self:\s*end/
  );

  // Mobile-first: stacked default actions, then progressive tablet/desktop rules.
  assert.match(
    styles,
    /\.headerActions\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/
  );

  assert.match(styles, /@media only screen and \(min-width: 768px\)/);
  assert.match(styles, /@media only screen and \(min-width: 1440px\)/);
  assert.doesNotMatch(styles, /@media[^\{]*\(max-width:/);
  assert.match(styles, /\.headerActions\s*>\s*button\s*\{[^}]*width:\s*100%/);

  // The shared ConfirmationModal may legitimately mention unsaved changes.
  // Only the obsolete inline UI labels are forbidden.
  assert.doesNotMatch(editor, /Back to pharmacies|Complete all four tabs/);
  assert.doesNotMatch(editor, />\s*Unsaved changes\s*</);
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
    assert.match(editor + presentation, new RegExp(`<${component}\\b`));
  }

  assert.doesNotMatch(
    editor,
    /<nav className=\{css\.tabs\}|<textarea|type="file"/
  );
});

//===================================================================

test('pharmacy data has three vertically separated sections and canonical input hints/counters', () => {
  for (const title of ['Pharmacy information', 'Working hours']) {
    assert.match(presentation, new RegExp(`title="${title}"`));
  }

  assert.match(
    presentation,
    /Pharmacy photo <span className=\{css\.required\}>\*<\/span>/
  );

  assert.match(
    styles,
    /\.profileBlock\s*\+\s*\.profileBlock\s*\{[^}]*border-top:/
  );

  assert.match(
    presentation,
    /tab === 'data'[\s\S]*?<CommentInput[\s\S]*?name="shortDescription"/
  );

  assert.match(fields, /data: \[\s*'name',\s*'shortDescription',/);

  assert.match(
    presentation,
    /input\('region'[\s\S]*input\('settlement'[\s\S]*css\.fullWidth[\s\S]*input\('address'/
  );

  assert.match(
    presentation,
    /input\('phone', \{ maxLength: USER_PHONE_MAX_LENGTH \}\)/
  );

  assert.match(
    presentation,
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
  assert.match(presentation, /onChange=\{\(selection\) =>/);
  assert.match(presentation, /disabled=\{busy !== null\}/);
  assert.match(presentation, /onDownloadFile=\{async \(file\) =>/);

  assert.match(
    presentation,
    /downloadOwnedPharmacyDocument\(\s*pharmacyId,\s*file\.documentId\s*\)/
  );

  assert.doesNotMatch(
    editor,
    /Save the pharmacy draft first|Owner documents:\s*<a|Pharmacy documents <span/
  );
});
