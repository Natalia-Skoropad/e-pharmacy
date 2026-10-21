import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const controls = readFileSync(
  new URL('./FieldControls.tsx', import.meta.url),
  'utf8'
);

const styles = readFileSync(
  new URL('./FormField.module.css', import.meta.url),
  'utf8'
);

const password = readFileSync(
  new URL('../PasswordInput/PasswordInput.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('shared text, textarea and password controls replace localized browser validation popups', () => {
  assert.match(controls, /event\.preventDefault\(\)/);
  assert.match(controls, /setMessage\('Please fill out this field\.'\)/);

  assert.match(
    controls,
    /setMessage\('Please enter a valid email address\.'\)/
  );

  assert.equal(
    (controls.match(/onInvalid=\{constraint.onInvalid\}/g) ?? []).length,
    2
  );

  assert.match(password, /onInvalid=\{constraint.onInvalid\}/);
  assert.match(controls, /role="tooltip"/);

  assert.match(
    styles,
    /\.validationTooltip\s*\{[^}]*background-color: var\(--color-text-primary\)/
  );

  assert.match(controls, /constraint.message \? `\$\{id\}-validation-tooltip`/);
});
