import assert from 'node:assert/strict';
import test from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import FavoriteToggleButton from './FavoriteToggleButton';

//===================================================================

test('announces active and pending favorite states', () => {
  const activeMarkup = renderToStaticMarkup(
    createElement(FavoriteToggleButton, {
      isActive: true,
      onClick: () => undefined,
    })
  );

  assert.match(activeMarkup, /aria-pressed="true"/);
  assert.match(activeMarkup, /aria-label="Remove from favorites"/);
  assert.doesNotMatch(activeMarkup, /aria-busy=/);

  const pendingMarkup = renderToStaticMarkup(
    createElement(FavoriteToggleButton, {
      isActive: false,
      isPending: true,
      onClick: () => undefined,
    })
  );

  assert.match(pendingMarkup, /aria-busy="true"/);
  assert.match(pendingMarkup, /aria-label="Updating favorites"/);
  assert.match(pendingMarkup, /disabled=""/);
});
