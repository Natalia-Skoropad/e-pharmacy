import assert from 'node:assert/strict';
import test from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ReviewRatingInput } from './ReviewRatingInput';

//===================================================================

test('renders a required radio group with selected state and a described error', () => {
  const markup = renderToStaticMarkup(
    createElement(ReviewRatingInput, {
      id: 'review-rating',
      value: 3,
      error: 'Choose a rating.',
      isTouched: true,
      disabled: false,
      onChange: () => undefined,
    })
  );

  assert.match(markup, /role="radiogroup"/);
  assert.match(markup, /aria-required="true"/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /aria-describedby="review-rating-error"/);
  assert.equal((markup.match(/type="radio"/g) ?? []).length, 5);
  assert.match(markup, /checked=""[^>]*value="3"/);
  assert.match(markup, /Choose a rating\./);
});

//===================================================================

test('disables every rating option while the composer is unavailable', () => {
  const markup = renderToStaticMarkup(
    createElement(ReviewRatingInput, {
      id: 'review-rating',
      value: 0,
      isTouched: false,
      disabled: true,
      onChange: () => undefined,
    })
  );

  assert.equal((markup.match(/disabled=""/g) ?? []).length, 5);
  assert.doesNotMatch(markup, /aria-invalid=/);
});
