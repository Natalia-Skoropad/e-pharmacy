import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

//===================================================================

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('PictureCard owns the styled, accessible photo-upload error for every consumer', async () => {
  const component = await readSource('./PictureCard.tsx');
  const styles = await readSource('./PictureCard.module.css');

  assert.match(component, /error\?: string \| null/);
  assert.match(component, /const \[localError, setLocalError\] = useState/);
  assert.match(component, /const visibleError = error \|\| localError/);
  assert.match(component, /reportError\(fileError\)/);
  assert.match(component, /reportError\(pictureUrlError\)/);
  assert.match(component, /reportError\(mergedLabels\.uploadError\)/);
  assert.match(component, /<p className=\{css\.error\} role="alert">/);
  assert.match(component, /<CircleAlert size=\{16\}/);

  assert.match(
    styles,
    /\.error\s*\{[\s\S]*?border: 1px solid var\(--color-error\)/
  );

  assert.match(
    styles,
    /\.error\s*\{[\s\S]*?background: var\(--color-error-soft/
  );
});
