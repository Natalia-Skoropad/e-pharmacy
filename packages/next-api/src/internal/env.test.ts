import assert from 'node:assert/strict';
import test from 'node:test';

import { getNextApiServerEnvironment } from './env.ts';

//===================================================================

test('production requires an HTTPS backend URL and BFF proxy secret', () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    BFF_PROXY_SECRET: process.env.BFF_PROXY_SECRET,
  };

  try {
    process.env.NODE_ENV = 'production';
    process.env.API_BASE_URL = 'https://api.example.com';
    delete process.env.BFF_PROXY_SECRET;

    assert.throws(
      () => getNextApiServerEnvironment(),
      /BFF_PROXY_SECRET is required/
    );

    process.env.BFF_PROXY_SECRET = 'deployment-secret';
    assert.equal(
      getNextApiServerEnvironment().bffProxySecret,
      'deployment-secret'
    );

    process.env.API_BASE_URL = 'http://api.example.com';
    assert.throws(
      () => getNextApiServerEnvironment(),
      /must use https in production/
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
