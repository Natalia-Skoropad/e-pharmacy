import assert from 'node:assert/strict';
import test from 'node:test';

import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime.js';

import CatalogResourceStateView from './CatalogResourceState/CatalogResourceState';

//===================================================================

const TEST_APP_ROUTER: AppRouterInstance = {
  back: () => undefined,
  forward: () => undefined,
  refresh: () => undefined,
  push: () => undefined,
  replace: () => undefined,
  prefetch: () => undefined,
};

//===================================================================

function renderWithAppRouter(node: ReactNode): string {
  return renderToStaticMarkup(
    <AppRouterContext.Provider value={TEST_APP_ROUTER}>
      {node}
    </AppRouterContext.Provider>
  );
}

//===================================================================

test('renders unavailable, empty and success catalog states exclusively', () => {
  const unavailableMarkup = renderWithAppRouter(
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

  const emptyMarkup = renderWithAppRouter(
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

  const successMarkup = renderWithAppRouter(
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
