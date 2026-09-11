import assert from 'node:assert/strict';
import test from 'node:test';

import { getProductImageSrc } from './product-images';

//===================================================================

function withEnvironment(
  environment: Readonly<{
    nodeEnv?: string;
    apiUrl?: string;
  }>,
  callback: () => void
): void {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousApiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (environment.nodeEnv === undefined) {
    Reflect.deleteProperty(process.env, 'NODE_ENV');
  } else {
    Reflect.set(process.env, 'NODE_ENV', environment.nodeEnv);
  }

  if (environment.apiUrl === undefined) {
    Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_API_URL');
  } else {
    Reflect.set(process.env, 'NEXT_PUBLIC_API_URL', environment.apiUrl);
  }

  try {
    callback();
  } finally {
    if (previousNodeEnv === undefined) {
      Reflect.deleteProperty(process.env, 'NODE_ENV');
    } else {
      Reflect.set(process.env, 'NODE_ENV', previousNodeEnv);
    }

    if (previousApiUrl === undefined) {
      Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_API_URL');
    } else {
      Reflect.set(process.env, 'NEXT_PUBLIC_API_URL', previousApiUrl);
    }
  }
}

//===================================================================

test('keeps already absolute image URLs unchanged', () => {
  assert.equal(
    getProductImageSrc('https://cdn.example.com/product.png'),
    'https://cdn.example.com/product.png'
  );

  assert.equal(
    getProductImageSrc('data:image/png;base64,abc'),
    'data:image/png;base64,abc'
  );

  assert.equal(
    getProductImageSrc('blob:https://example.com/id'),
    'blob:https://example.com/id'
  );
});

//===================================================================

test('resolves backend image paths against a validated public API URL', () => {
  withEnvironment(
    {
      nodeEnv: 'production',
      apiUrl: 'https://api.example.com/',
    },
    () => {
      assert.equal(
        getProductImageSrc('/images/products/example.png'),
        'https://api.example.com/images/products/example.png'
      );

      assert.equal(
        getProductImageSrc('images/products/example.png'),
        'https://api.example.com/images/products/example.png'
      );
    }
  );
});

//===================================================================

test('uses localhost only outside production', () => {
  withEnvironment({ nodeEnv: 'development' }, () => {
    assert.equal(
      getProductImageSrc('/images/products/example.png'),
      'http://localhost:4000/images/products/example.png'
    );
  });

  withEnvironment({ nodeEnv: 'production' }, () => {
    assert.equal(getProductImageSrc('/images/products/example.png'), undefined);
  });
});

//===================================================================

test('rejects unsafe or malformed configured backend origins', () => {
  for (const apiUrl of [
    'not-a-url',
    'javascript:alert(1)',
    'http://api.example.com',
    'https://user:password@api.example.com',
    'https://api.example.com?token=secret',
    'https://api.example.com#fragment',
  ]) {
    withEnvironment({ nodeEnv: 'production', apiUrl }, () => {
      assert.equal(
        getProductImageSrc('/images/products/example.png'),
        undefined
      );
    });
  }
});
