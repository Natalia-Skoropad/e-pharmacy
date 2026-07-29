import assert from 'node:assert/strict';
import test from 'node:test';

import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ClientProviderStack } from './client-provider-stack';

//===================================================================

function createProbeProvider(name: string) {
  return function ProbeProvider({ children }: Readonly<{ children: ReactNode }>) {
    return createElement('section', { 'data-provider': name }, children);
  };
}

//===================================================================

test('renders Auth → Favorites → Cart inside the client provider stack', () => {
  const markup = renderToStaticMarkup(
    createElement(
      ClientProviderStack,
      {
        ToastProvider: createProbeProvider('toast'),
        AuthProvider: createProbeProvider('auth'),
        FavoritesProvider: createProbeProvider('favorites'),
        CartProvider: createProbeProvider('cart'),
      },
      createElement('main', { 'data-testid': 'content' }, 'Client content')
    )
  );

  assert.match(
    markup,
    /^<section data-provider="toast"><section data-provider="auth"><section data-provider="favorites"><section data-provider="cart"><main data-testid="content">Client content<\/main><\/section><\/section><\/section><\/section>$/
  );
});
