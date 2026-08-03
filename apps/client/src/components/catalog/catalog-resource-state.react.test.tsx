import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import CatalogResourceStateView from './CatalogResourceState/CatalogResourceState';

//===================================================================

test('renders unavailable, empty and success catalog states exclusively', () => {
  const unavailableMarkup = renderToStaticMarkup(
    <CatalogResourceStateView
      state={{ status: 'unavailable' }}
      emptyTitle="No products"
      emptyMessage="Nothing matched."
      unavailableMessage="Catalog is temporarily unavailable."
    >
      <p>Results</p>
    </CatalogResourceStateView>
  );

  assert.match(unavailableMarkup, /Catalog is temporarily unavailable/);
  assert.doesNotMatch(unavailableMarkup, /No products|Nothing matched|Results/);

  const emptyMarkup = renderToStaticMarkup(
    <CatalogResourceStateView
      state={{ status: 'empty', reason: 'no-matches' }}
      emptyTitle="No products"
      emptyMessage="Nothing matched."
      unavailableMessage="Catalog is temporarily unavailable."
    >
      <p>Results</p>
    </CatalogResourceStateView>
  );

  assert.match(emptyMarkup, /No products/);
  assert.match(emptyMarkup, /Nothing matched/);
  assert.doesNotMatch(emptyMarkup, /temporarily unavailable|Results/);

  const successMarkup = renderToStaticMarkup(
    <CatalogResourceStateView
      state={{ status: 'success' }}
      emptyTitle="No products"
      emptyMessage="Nothing matched."
      unavailableMessage="Catalog is temporarily unavailable."
    >
      <p>Results</p>
    </CatalogResourceStateView>
  );

  assert.match(successMarkup, /Results/);
  assert.doesNotMatch(
    successMarkup,
    /No products|Nothing matched|temporarily unavailable/
  );
});
