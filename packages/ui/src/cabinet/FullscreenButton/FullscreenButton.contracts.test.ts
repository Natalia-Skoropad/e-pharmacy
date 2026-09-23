import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('fullscreen button synchronizes with the browser event and cleans up its listener', async () => {
  const source = await readFile(
    new URL('./FullscreenButton.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /document\.addEventListener\('fullscreenchange'/);
  assert.match(source, /document\.removeEventListener\('fullscreenchange'/);
  assert.match(source, /Boolean\(document\.fullscreenElement\)/);
  assert.match(source, /aria-label=\{isFullscreen \? exitLabel : enterLabel\}/);
  assert.match(source, /toggleFullscreen\(document\)/);
});
