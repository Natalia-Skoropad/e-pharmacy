import assert from 'node:assert/strict';
import test from 'node:test';

import { createSafeEmailLogMetadata } from './email-log-metadata';

//===============================================================

test('email preview metadata never contains message bodies or reset secrets', () => {
  const resetToken = 'super-secret-reset-token';
  const options = {
    to: 'user@example.com',
    subject: 'Reset your password',
    html: `<a href="https://client.example.com/reset#token=${resetToken}">Reset</a>`,
    text: `Reset: https://client.example.com/reset#token=${resetToken}`,
  };

  const metadata = createSafeEmailLogMetadata('no-reply@example.com', options);
  const serialized = JSON.stringify(metadata);

  assert.deepEqual(metadata, {
    from: 'no-reply@example.com',
    to: 'user@example.com',
    subject: 'Reset your password',
  });

  assert.equal(serialized.includes(resetToken), false);
  assert.equal(serialized.includes(options.html), false);
  assert.equal(serialized.includes(options.text), false);
});
