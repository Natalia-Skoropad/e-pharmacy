import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const editor = readFileSync(
  new URL('./MarkdownTextarea.tsx', import.meta.url),
  'utf8'
);

const converter = readFileSync(
  new URL(
    '../../data-display/MarkdownContent/markdown-to-html.ts',
    import.meta.url
  ),
  'utf8'
);

//===================================================================

test('intentional paragraph spacing survives editor serialization and rendering', () => {
  assert.ok(editor.includes("return '&nbsp;\\n\\n'"));
  assert.match(editor, /Add paragraph spacing/);
  assert.match(converter, /line\.trim\(\) === '&nbsp;'/);
  assert.match(converter, /blocks\.push\('<p><br><\/p>'\)/);
});
