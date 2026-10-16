import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import { TextInputControl, TextareaControl } from './FieldControls';

//===================================================================

const handleChange = () => undefined;

//===================================================================

test('textarea error is anchored inside its control instead of the outer field', () => {
  const markup = renderToStaticMarkup(
    <TextareaControl
      id="pharmacy-address"
      name="address"
      label="Pharmacy address"
      value=""
      hint="Enter the street address only."
      error="Address is required"
      isTouched
      maxLength={200}
      onChange={handleChange}
    />
  );

  assert.match(
    markup,
    /aria-describedby="pharmacy-address-hint pharmacy-address-error"/
  );

  assert.match(
    markup,
    /class="inputWrap">\s*<textarea[\s\S]*?<span class="textareaCounter"[\s\S]*?<p class="error textareaError" id="pharmacy-address-error">Address is required<\/p>\s*<\/div>/
  );

  assert.equal((markup.match(/id="pharmacy-address-error"/g) ?? []).length, 1);
});

//===================================================================

test('single-line controls retain their existing field-level error placement', () => {
  const markup = renderToStaticMarkup(
    <TextInputControl
      id="pharmacy-name"
      name="name"
      label="Pharmacy name"
      value=""
      error="Name is required"
      isTouched
      onChange={handleChange}
    />
  );

  assert.match(
    markup,
    /<\/div>\s*<p class="error" id="pharmacy-name-error">Name is required<\/p>/
  );

  assert.doesNotMatch(markup, /class="error textareaError"/);
});

//===================================================================

test('textarea errors stay accessible without visible error text before touch', () => {
  const markup = renderToStaticMarkup(
    <TextareaControl
      id="payment-purpose"
      name="paymentPurpose"
      label="Payment purpose"
      value=""
      error="Payment purpose is required"
      isTouched={false}
      onChange={handleChange}
    />
  );

  assert.match(
    markup,
    /<p class="error textareaError" id="payment-purpose-error"><\/p>/
  );

  assert.doesNotMatch(markup, /aria-describedby="payment-purpose-error"/);
  assert.doesNotMatch(markup, /aria-invalid="true"/);
});

//===================================================================

test('textarea error CSS anchors the badge to the textarea border', async () => {
  const css = await readFile(
    new URL('./FormField.module.css', import.meta.url),
    'utf8'
  );

  assert.match(css, /\.textareaError\s*\{[^}]*bottom:\s*-10px;/);
  assert.match(css, /\.textarea\s*\{[^}]*display:\s*block;/);
});
