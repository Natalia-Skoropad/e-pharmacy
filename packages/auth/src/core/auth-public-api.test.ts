import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const packageJson = JSON.parse(
  await readFile(new URL('../../package.json', import.meta.url), 'utf8')
) as { exports: Record<string, string> };

//===================================================================

test('publishes only explicit React, Next, errors, and routing entrypoints', () => {
  assert.deepEqual(Object.keys(packageJson.exports).sort(), [
    './errors',
    './next',
    './react',
    './routing',
  ]);
  assert.equal('.' in packageJson.exports, false);
  assert.equal('./session' in packageJson.exports, false);
  assert.equal('./core' in packageJson.exports, false);
  assert.equal('./guards' in packageJson.exports, false);
});
