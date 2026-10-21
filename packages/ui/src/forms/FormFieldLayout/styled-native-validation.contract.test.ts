import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const source = (name: string) =>
  readFileSync(new URL(name, import.meta.url), 'utf8');

const controls = source('./FieldControls.tsx');
const password = source('../PasswordInput/PasswordInput.tsx');

//===================================================================

// Browser-native constraint bubbles are not skinnable with global CSS.
// The shared primitives keep the required label and ARIA semantics while
// their domain forms own validation messages.
test('shared form inputs do not render native browser validation popovers', () => {
  assert.doesNotMatch(controls, /onInvalid=/);
  assert.doesNotMatch(password, /onInvalid=/);
  assert.match(controls, /<input[\s\S]*?aria-required=\{required\}/);
  assert.match(password, /<input[\s\S]*?aria-required=\{required\}/);
  assert.doesNotMatch(controls, /validation-tooltip|role="tooltip"/);
  assert.doesNotMatch(password, /validation-tooltip|role="tooltip"/);
  assert.match(controls, /aria-required=\{required\}/);
  assert.match(password, /aria-required=\{required\}/);
  assert.match(controls, /inputMode=\{type === 'email' \? 'email'/);
});

//===================================================================

// The only remaining raw controls with native required constraints were the
// shared document picker and the client review rating radios.
test('document uploads and review radios use styled form errors instead of native bubbles', () => {
  const documents = source('../DocumentUpload/DocumentUpload.tsx');

  const rating = source(
    '../../../../../apps/client/src/components/common/ReviewsSection/ReviewRatingInput.tsx'
  );

  assert.match(documents, /aria-required=\{required\}/);
  assert.doesNotMatch(documents, /\n\s+required=\{required\}/);
  assert.match(rating, /aria-required="true"/);
  assert.doesNotMatch(rating, /\n\s+required\n/);
});
