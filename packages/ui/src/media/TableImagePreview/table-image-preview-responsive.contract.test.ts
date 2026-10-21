import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const styles = readFileSync(
  new URL('./TableImagePreview.module.css', import.meta.url),
  'utf8'
);

//===================================================================

test('shared table image preview has a fixed flex basis and cannot shrink in narrow comment rows', () => {
  assert.match(styles, /flex:\s*0\s+0\s+var\(--table-image-preview-size\)/);
  assert.match(styles, /min-width:\s*var\(--table-image-preview-size\)/);
});
