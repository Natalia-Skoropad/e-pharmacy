import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

//===================================================================

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('Pharmacy photo forwards field validation into PictureCard instead of duplicating the message', async () => {
  const editor = await readSource('./OwnedPharmacyEditorTabContent.tsx');
  const css = await readSource('./OwnedPharmacyEditor.module.css');

  assert.match(editor, /<PictureCard[\s\S]*?error=\{errors\.imageUrl\}/);
  assert.doesNotMatch(editor, /className=\{css\.pictureError\}/);
  assert.doesNotMatch(css, /\.pictureError\s*\{/);
});
